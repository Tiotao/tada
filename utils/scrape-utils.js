const _ = require('underscore');
const configs = require('../configs');
const logger  = require('logger').createLogger();
logger.setLevel(configs.LOGGER_LEVEL);


function combine(dict, entry) {
    if (entry.local_id in dict) {
        let old_search_ref = dict[entry.local_id].search_ref;
        dict[entry.local_id].search_ref = old_search_ref.concat(entry.search_ref);
    } else {
        dict[entry.local_id] = entry;
    }
    return dict;
}

function parseSeconds(str){
    var p = str.split(':'),
        s = 0, m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }
    return s;
}

function combineDuplicates(entries) {
    entries = _.flatten(entries, true);
    const raw_length = entries.length;
    let entry_dict = entries.reduce(combine, {});
    entries = Object.values(entry_dict);
    logger.info("collapse db with same local_id:", raw_length, '->', entries.length);
    return entries;
}

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

function groupBy(data, start_time, end_time, duration, max_count, keyFunc) {
    // console.log("group by start")
    // console.log(data.length);
    data = sortBy(data, keyFunc);
    // console.log(data)
    // console.log(data)
    let ret = [[]];
    let group_index = 0, data_index = 0;
    let window_start = end_time - duration;
    let window_end = end_time;
    while(group_index < max_count) {
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
                window_start -= duration; 
            }
        }
    }

    // console.log(end_time, window_start, data_index);

    // console.log("group by end")

    // console.log(acc, group_index, data_index);
    return ret;
}

function normalizeDay(time) {
    let normalized_time = new Date(time*1000);
    normalized_time.setUTCHours(0);
    normalized_time.setUTCMinutes(0);
    normalized_time.setUTCSeconds(0);
    normalized_time.setUTCMilliseconds(0);
    return normalized_time / 1000
}

function groupByDay(data, end_time, max_count, keyFunc = (d)=>{return d.timestamp}) {
    // normalize start time
    const day = 86400;
    const start_time  = end_time - day*max_count;
    return groupBy(data, start_time, end_time, day, max_count, keyFunc);

}

function groupByHour(data, end_time, max_count, keyFunc = (d)=>{return d.timestamp}) {
    const hour = 3600;
    const day = 86400;
    
    const start_time  = end_time - day;
    return groupBy(data, start_time, end_time, hour, max_count, keyFunc);
}


function groupByDuration(data, now=true, duration=[3600, 86400], curr, keyFunc = (d)=>{return d.timestamp}) {

    const window_size = duration[0];
    const max_window = duration[1];
    const max_count = max_window / window_size;


    function compare(a,b) {
        if (keyFunc(a) < keyFunc(b))
          return 1;
        if (keyFunc(a) > keyFunc(b))
          return -1;
        return 0;
    }

    data.sort(compare);
    
    let ret = [[]];
    let ti = 0, di = 0
    
    let curr_time_raw;
    let curr_time;

    if (now) {
        curr_time_raw = new Date();
    } else{
        if (curr) { 
            curr_time_row = curr
        } else {
            curr_time_raw = new Date(configs.SCRAPE_END_TIME*1000);
        }
    }

    curr_time_raw.setHours(0);
    curr_time_raw.setMinutes(0);
    curr_time_raw.setSeconds(0);
    curr_time_raw.setMilliseconds(0);
    curr_time = curr_time_raw / 1000 + 86400;


    let end = curr_time,
        start = curr_time - window_size
    
    while (ti < max_count-1) {
        if (di < data.length && keyFunc(data[di]) > start && keyFunc(data[di]) <= end) {
            ret[ti].push(data[di]);
            di += 1
        } else {
            ret.push([]);
            ti += 1;
            end = start;
            start = start  - window_size;
        }
    }

    let acc = 0;

    for (let i = 0; i < ret.length; i++) {
        acc += ret[i].length
    }

    return ret;
}


module.exports = {
    combineDuplicates: combineDuplicates,
    parseSeconds: parseSeconds,
    groupByDuration: groupByDuration,
    groupByDay: groupByDay,
    groupByHour: groupByHour,
    normalizeDay: normalizeDay
}

