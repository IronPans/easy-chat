function addEventListener(elem, type, callback, capture) {
    capture = capture || false;
    if (elem.addEventListener) {
        elem.addEventListener(type, callback, capture);
    } else if (elem.attachEvent) {
        elem.attachEvent(type, callback);
    }
}

function removeEventListener(elem, type, callback) {
    if (elem.removeEventListener) {
        elem.removeEventListener(type, callback);
    } else if (elem.detachEvent) {
        elem.detachEvent(type, callback);
    }
}

function on(elem, type, callback, capture) {
    var event = type.split(/(\s|\t)+/);
    event.forEach(function(t) {
        if (t) {
            removeEventListener(elem, t, callback);
            addEventListener(elem, t, callback, capture);
        }
    });
}

function forEach(arr, callback) {
    if (Array.isArray(arr)) {
        arr.forEach(function (value, key) {
            callback(value, key);
        })
    } else if (arr.length) {
        for (var i = 0; i < arr.length; i++) {
            callback(arr[i], i);
        }
    }
}

function insertBefore(parent, newDom, oldDom) {
    parent.insertBefore(newDom, oldDom);
}

function insertAfter(parent, newDom, oldChild) {
    const nextDom = oldChild.nextElementSibling;
    if (nextDom) {
        parent.insertBefore(newDom, nextDom);
    } else {
        parent.appendChild(newDom);
    }
}

function ajax(param, success, error) {
    var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');

    var type = 'application/x-www-form-urlencoded; charset=UTF-8',
        completed = false,
        accept = '*/'.concat('*');
    var dataType = param.dataType;
    var url = param.url;
    var method = param.method ? param.method : 'GET';
    var data = param.data ? param.data : null;
    switch (dataType) {
        case 'text':
            type = 'text/plain';
            break;
        case 'json':
            type = 'application/json, text/javascript';
            break;
        case 'html':
            type = 'text/html';
            break;
        case 'xml':
            type = 'application/xml, text/xml';
            break;
    }

    if (type !== 'application/x-www-form-urlencoded') {
        accept = type + ', */*; q=0.01';
    }

    if (xhr) {
        xhr.open(method, url, true);
        xhr.setRequestHeader('Accept', accept);
        xhr.onreadystatechange = function () {
            if (completed) {
                return;
            }
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    completed = true;
                    var data = void 0;
                    switch (dataType) {
                        case 'json':
                            data = JSON.parse(xhr.responseText);
                            break;
                        case 'xml':
                            data = xhr.responseXML;
                            break;
                        default:
                            data = xhr.responseText;
                            break;
                    }
                    success(data);
                } else if (typeof error === 'function') {
                    error(xhr.status);
                }
            }
        };

        xhr.send(data);
    }
}

function addClass(elem, className) {
    var classes = className.split(/\s+/);
    forEach(classes, function(c, k) {
        if (elem.classList) {
            elem.classList.add(c);
        } else {
            elem.className += ' ' + c;
        }
    })
}

function hasClass(elem, className) {
    if (elem.classList) {
        return elem.classList.contains(className);
    } else {
        return new RegExp('(^| )' + className + '( |$)', 'gi').test(elem.className);
    }
}

function removeClass(elem, className) {
    const classes = className.split(/\s+/);
    forEach(classes, function(c, k) {
        if (elem.classList) {
            elem.classList.remove(c);
        } else {
            elem.className = elem.className.replace(new RegExp('^' + c + '$'), '');
        }
    })
}

function closeTarget(target, source, inView, outView) {
    while(target) {
        if ((typeof source === 'string' && hasClass(target, source)) || (target === source)) {
            if (inView && typeof inView === 'function') {
                inView(target);
            }
            break;
        } else if (source !== document && target.nodeName === '#document') {
            if (outView && typeof outView === 'function') {
                outView(target);
            }
        }
        target = target.parentNode;
    }
    return target;
}