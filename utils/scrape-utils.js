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
    logger.debug(entries);
    logger.info("collapse db with same local_id:", raw_length, '->', entries.length);
    return entries;
}

function groupByHour(data, end_time) {

    function compare(a,b) {
        if (a.timestamp < b.timestamp)
          return 1;
        if (a.timestamp > b.timestamp)
          return -1;
        return 0;
    }

    data.sort(compare);
    
    let ret = [[]];
    let ti = 0, di = 0
    const p = 3600000;
    const curr_time = Math.round( Date.now() / p) * p / 1000;
    let end = curr_time,
        start = curr_time - 3600;
    const end_time = curr_time - 129600; // 36 hrs
    
    while (end > end_time) {
        if (di < data.length && data[di].timestamp > start && data[di].timestamp <= end) {
            // delete data[di].timestamp;
            ret[ti].push(data[di]);
            di += 1
        } else {
            ret.push([]);
            ti += 1;
            end = start
            start = start  - 3600
        }
    }
    return ret;
}


module.exports = {
    combineDuplicates: combineDuplicates,
    parseSeconds: parseSeconds,
    groupByHour: groupByHour,
}

