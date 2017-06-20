var store = {};

module.exports = {
    set: function(key, content) {
        return store[key] = content;
    },
    get: function(key) {
        return store[key];
    }
}
