const _ = require('underscore');
const config = require('config');
const logger  = require('logger').createLogger();
logger.setLevel(config.get("Logger.level"));

/**
 * Combine data entries with same resource id
 * @param {Array{Array}} entries - 2D array contains multiple batches of data returned from 
 *                                 database query. Each batch is an array of data entries
 * @return {Array} 1D array contains unique data entries
 */
function combineDuplicates(entries) {
    entries = _.flatten(entries, true);
    const raw_length = entries.length;

    function combine(dict, entry) {
        if (entry.local_id in dict) {
            let old_search_ref = dict[entry.local_id].search_ref;
            dict[entry.local_id].search_ref = old_search_ref.concat(entry.search_ref);
        } else {
            dict[entry.local_id] = entry;
        }
        return dict;
    }

    let entry_dict = entries.reduce(combine, {});
    entries = Object.values(entry_dict);
    logger.info("collapse db with same local_id:", raw_length, '->', entries.length);
    return entries;
}

/**
 * Sort data by customized function
 * @param {Array} data - a collection of data, stored in an array
 * @param {Function} keyFunc - function to access key used for indexing data
 * @return {Array} sorted data
 */
function sortBy(data, keyFunc) {
    function compare(a,b) {
        if (keyFunc(a) < keyFunc(b))
          return 1;
        if (keyFunc(a) > keyFunc(b))
          return -1;
        return 0;
    }
    data.sort(compare);
    return data;
}

/**
 * Get timestamp of the beginning of the day - 00:00:00+UTC
 * @param {Number} time - number of seconds since 01 Jan 1970 00:00:00 GMT, 10 digits
 * @return {Number} 10-digit timestamp
 */
function normalizeDay(time) {
    let normalized_time = new Date(time*1000);
    normalized_time.setUTCHours(0);
    normalized_time.setUTCMinutes(0);
    normalized_time.setUTCSeconds(0);
    normalized_time.setUTCMilliseconds(0);
    return normalized_time / 1000
}

/**
 * Denormalize relative view count range into absolute range
 * @param {Array<Number>} range - a pair of number represent the relative range [0-100, 0-100]
 * @param {Number} max_view - max view count ever recorded
 * @return {Array<Number>} a pair of number represent absolute range of view counts [0-max_view, 0-max_view]
 */
function parseViewCountRange(range, max_view) {
    range = range.map((r)=>{
        return (Math.pow(10, r/100 * Math.log10(max_view))-1) ;
    });
    return range;
}

/**
 * Denormalize relative like view ratio range into absolute range
 * @param {Array<Number>} range - a pair of number represent the relative range [0-100, 0-100]
 * @return {Array<Number>} a pair of number represent absolute range of like view ratio [0-1, 0-1]
 */
function parseViewLikeRatioRange(range) {
    const log101 = 2.0043213737826426;
    range = range.map((r)=>{
        return ((Math.pow(10, r/100 * log101)-1)) / 100 ;
    });
    return range;
}

/**
 * Group data by a customized metric and bounds
 * @param {Array} data - a collection of data in array
 * @param {Number} start_bound - lower bound of the data, data metric must be higher than this 
 *                               in order to get grouped.
 * @param {Number} end_bound - higher bound of the data, data metric must be lower than this 
 *                             in order to get grouped.
 * @param {Number} window_size - size of the group
 * @param {Number} max_count - max number of groups
 * @param {Function} keyFunc - function used to access data's metric
 * @return {Array<Array>} 2D array that groups data into different groups.
 */
function groupBy(data, start_bound, end_bound, window_size, max_count, keyFunc) {
    data = sortBy(data, keyFunc);
    let ret = [[]];
    let group_index = 0, data_index = 0;
    let window_start = end_bound - window_size;
    let window_end = end_bound;
    while(group_index < max_count && window_start >= start_bound) {
        if (data_index < data.length && keyFunc(data[data_index]) > window_start && keyFunc(data[data_index]) <= window_end) {
            ret[group_index].push(data[data_index]);
            data_index += 1
        } else {
            if (data_index < data.length && keyFunc(data[data_index]) > window_end) {
                data_index += 1;
            } else {
                if (group_index < max_count-1) {
                    ret.push([]);
                }
                group_index += 1;
                window_end = window_start;
                window_start -= window_size; 
            }
        }
    }
    return ret;
}

/**
 * Group data by like view ratio in log scale (100 groups)
 * @param {Array} data - a collection of data in array
 * @return {Array<Array>} 2D array that groups data into 100 groups. 
 *                        First entry has lowest like view ratio
 */
function groupByViewLikeRatio(data) {
    const log101 = 2.0043213737826426;
    return groupBy(data, 0, 1, 0.01, 100, (d)=>{
        return Math.log10(d.stats.vl_ratio*100 + 1) / log101;
    })
}

/**
 * Group data by view count in log scale (100 groups)
 * @param {Array} data - a collection of data in array
 * @return {Array<Array>} 2D array that groups data into 100 groups. 
 *                        First entry has lowest view count
 */
function groupByViewCount(data, max_view) {
    return groupBy(data, 0, 1, 0.01, 100, (d)=>{
        return Math.log10(d.stats.view_count + 1) / Math.log10(max_view);
    })
        
}

/**
 * Group data by timestamp in by day
 * @param {Array} data - a collection of data in array
 * @param {Number} end_time - 10-digit timestamp. Consider only data before this timestamp
 * @param {Number} max_count - max number of groups
 * @param {Function} keyFunc - function used to access entry's timestamp
 * @return {Array<Array>} 2D array that groups data into day groups 
 *                        First entry is the nearist day.
 */
function groupByDay(data, end_time, max_count, keyFunc=(d)=>{return d.timestamp}) {
    const day = 86400;
    const start_time  = end_time - day*max_count;
    return groupBy(data, start_time, end_time, day, max_count, keyFunc);

}
/**
 * Group data by timestamp in by hour
 * @param {Array} data - a collection of data in array
 * @param {Number} end_time - 10-digit timestamp. Consider only data before this timestamp
 * @param {Number} max_count - max number of groups
 * @param {Function} keyFunc - function used to access entry's timestamp
 * @return {Array<Array>} 2D array that groups data into hour groups 
 *                        First entry is the nearist hour.
 */
function groupByHour(data, end_time, max_count, keyFunc = (d)=>{return d.timestamp}) {
    const hour = 3600;
    const day = 86400;
    const start_time  = end_time - day;
    return groupBy(data, start_time, end_time, hour, max_count, keyFunc);
}

/**
 * Calculate heatmap level for each data, sorted based on view count and like view ratio.
 * @param {Number} view_count - original view count of the video
 * @param {Number} vl_ratio - original like view ratio of the video
 * @param {Number} max_view - max view count ever recorded
 * @return {Array<Number>} a pair of numbers recording the heatmap level sorted by view count 
 *                         and like view ratio
 */
function calculateHeatmapLevel(view_count, vl_ratio, max_view) {
    const log101 = 2.0043213737826426;
    const view_level = Math.round(Math.log10(d.stats.view_count + 1) / Math.log10(max_view) * 5);
    const vlr_level = Math.round(Math.log10(d.stats.vl_ratio*100 + 1) / log101 * 5);
    return [view_level, vlr_level]
}


module.exports = {
    combineDuplicates: combineDuplicates,
    groupByDay: groupByDay,
    groupByHour: groupByHour,
    groupByViewLikeRatio: groupByViewLikeRatio,
    groupByViewCount: groupByViewCount,
    normalizeDay: normalizeDay,
    calculateHeatmapLevel: calculateHeatmapLevel,
    parseViewLikeRatioRange: parseViewLikeRatioRange,
    parseViewCountRange: parseViewCountRange,
}

