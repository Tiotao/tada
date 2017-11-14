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

function groupByDuration(data, now=true, duration=3600, keyFunc = (d)=>{return d.timestamp}) {

    // console.log(data.length);
    
    const max_count = configs.MAX_WINDOW / duration;

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
    const p = 3600000;
    let curr_time;
    if (now) {
        curr_time = Math.round( Date.now() / p) * p / 1000
    } else{
        curr_time = configs.SCRAPE_END_TIME + duration;
    }
    let end = curr_time,
        start = curr_time - duration,
        window_count = 0

    while (ti < max_count) {
        if (di < data.length && keyFunc(data[di]) > start && keyFunc(data[di]) <= end) {
            ret[ti].push(data[di]);
            di += 1
        } else {
            ret.push([]);
            ti += 1;
            end = start;
            start = start  - duration;
        }
    }

    let acc = 0;

    for (let i = 0; i < ret.length; i++) {
        acc += ret[i].length
    }

    // console.log(">" + acc);
    return ret;
}


module.exports = {
    combineDuplicates: combineDuplicates,
    parseSeconds: parseSeconds,
    groupByDuration: groupByDuration,
}

