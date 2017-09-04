function openDB(name, onupgradeneeded, success, version) {
    var db = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    if (!window.indexedDB) {
        console.log('你的浏览器不支持IndexedDB');
        return;
    }
    version = version || 1;
    onupgradeneeded = onupgradeneeded || function() {};
    success = success || function() {};
    var requestDB = db.open(name, version);
    requestDB.onerror = function (event) {
        console.log('Open Error!');
    };
    requestDB.onsuccess = success;
    requestDB.onupgradeneeded = function(event) {
        onupgradeneeded(event);
    };
    return requestDB;
}

function createObjectStore(db, name, option) {
    if (!name) { return; }
    // 创建一个数据对象，名为name，默认用id来做数据键名(主键)
    option = option || {keyPath: 'id', autoIncrement: true};
    return db.createObjectStore(name, option);
}

function getObjectStore(db, dbName) {
    // 新建一个事务
    var transaction = db.transaction(dbName, 'readwrite');
    // 打开存储对象
    var objectStore = transaction.objectStore(dbName);
    return objectStore;
}

function add(objectStore, newItem, success) {
    if (!objectStore || !newItem) { return; }
    success = success || function() {};
    var objectStoreRequest = objectStore.add(newItem);
    objectStoreRequest.onsuccess = success;
}

function remove(objectStore, key, success) {
    if (!objectStore || !key) { return; }
    success = success || function() {};
    var objectStoreRequest = objectStore.delete(key);
    objectStoreRequest.onsuccess = success;
}

function get(objectStore, key, success) {
    if (!objectStore || !key) { return; }
    success = success || function() {};
    var objectStoreRequest = objectStore.get(key);
    objectStoreRequest.onsuccess = success;
}

function put(objectStore, newItem, success) {
    if (!objectStore || !newItem) { return; }
    success = success || function() {};
    var objectStoreRequest = objectStore.put(newItem);
    objectStoreRequest.onsuccess = success;
}

function getCursor(objectStore, next, done, range) {
    if (!objectStore) { return; }
    done = done || function() {};
    objectStore.openCursor().onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
            // cursor.value就是数据对象
            // 游标没有遍历完，继续
            next && next(cursor.value, event);
            cursor.continue();
        } else {
            done && done(event);
        }
    }
}