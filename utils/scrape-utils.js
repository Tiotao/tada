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

module.exports = {
    combineDuplicates: combineDuplicates,
    parseSeconds: parseSeconds,
}

