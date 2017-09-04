var text = document.querySelector('.free-chat-textarea');
var send = document.querySelector('.free-chat-send');
var body = document.querySelector('.free-chat-container-body');
var nameElem = document.querySelector('.free-chat-head-title input');
var userAvatar = document.getElementById('userAvatar');
var video = document.querySelector('.free-tool-movie');
var music = document.querySelector('.free-tool-music');
var image = document.querySelector('.free-tool-image');
var file = document.getElementById('image-file');
var socket = io.connect('http://localhost:3100');
var chatCommenting = document.getElementById('chat-commenting');
var chatFriend = document.getElementById('chat-friend');
var chatGroup = document.getElementById('chat-group');
var selectedRange = null;
var zIndex = 10010;
var user = '';
var currentChatroom = {};
var commenting = [];
var db;
var objectStore;
var defaultGroup = {
    userId: 'freeng',
    userName: 'FreeNG',
    avatar: 'http://oumfrpm5j.bkt.clouddn.com/freeng_logo.png',
    motto: ' This is a UI framework group.',
    commenting: [],
    type: 'all'
};
var defaultFriend = {
    userId: 'Wtsk',
    userName: 'TG',
    avatar: 'images/avatar/4.jpg',
    motto: 'This is all',
    commenting: [],
    type: 'single'
};
init();
function init() {
    user = getUser();
    scrollToBottom();
    createEmotion();
    initPopup();
    initNav();
    currentChatroom = defaultGroup;
    nameElem.value = currentChatroom.userName;
    userAvatar.src = currentChatroom.avatar;
    // open the indexeddb
    db = openDB('chatDB', function (event) {
        var db = event.target.result;
        var friendObjectStore = createObjectStore(db, 'chatFriend', {keyPath: 'userId'});
        friendObjectStore.add(defaultFriend);
        var groupObjectStore = createObjectStore(db, 'chatGroup', {keyPath: 'userId'});
        groupObjectStore.add(defaultGroup);
        var commentingObjectStore = createObjectStore(db, 'chatCommenting', {keyPath: 'userId'});
        commentingObjectStore.add(defaultGroup);
        commenting.push(defaultGroup);
    }, function (event) {
        var db = event.target.result;
        var groupObjectStore = getObjectStore(db, 'chatGroup');
        var friendObjectStore = getObjectStore(db, 'chatFriend');
        var list = [];
        objectStore = getObjectStore(db, 'chatCommenting');
        getCursor(objectStore, function (item, items) {
            list.push(createUserItem(item, true, commenting));
            commenting.push(item);
            if (item.userId === 'freeng') {
                var comments = item.commenting;
                createHistoryComment(comments);
            }
        }, function () {
            var length = list.length;
            while (length) {
                length--;
                chatCommenting.appendChild(list[length]);
            }
        });

        getCursor(groupObjectStore, function (item, items) {
            chatGroup.appendChild(createUserItem(item, false, commenting));
        });

        getCursor(friendObjectStore, function (item, items) {
            chatFriend.appendChild(createUserItem(item, false, commenting));
        });
    });
    send.addEventListener('click', function () {
        sendMessage();
    });
    socket.emit('online', {userId: user.userId});
    socket.on('online', function (data) {

    });
    socket.on('send', function (data) {
        if (data.to.type === 'all') {
            createItem('you', data);
            putComment(data);
        } else if (data.to.id === user.userId) {

        }
    });
    socket.on('offline', function (data) {
    });
    //nameElem.addEventListener('blur', function () {
    //    localStorage.setItem('chat-user', JSON.stringify({
    //        name: nameElem.value,
    //        userId: user.userId,
    //        avatar: 'http://2sharings.com/demo/ui/material_angular/img/profile-pics/1.jpg'
    //    }));
    //    user.userName = nameElem.value;
    //});
    text.addEventListener('keydown', function (e) {
        if (e.keyCode === 13) {
            sendMessage();
            e.stopPropagation();
            e.preventDefault();
        }
    });
    text.addEventListener('keyup', function () {
        saveSelection();
    });
    text.addEventListener('mouseup', function () {
        saveSelection();
    });
    body.addEventListener('scroll', function (e) {
        var num = 0;
        if (body.scrollTop === 0) {

        }
    });
    video.addEventListener('click', function () {
        openModal({
            title: '请输入网络视频地址',
            content: '<input type="text" class="link-input" id="video">',
            buttons: [{
                title: '确认',
                class: 'btn-primary',
                click: function (event, modal) {
                    var link = modal.querySelector('.link-input');
                    if (link.value) {
                        sendMessage({
                            text: '',
                            type: 'video',
                            src: link.value
                        });
                        closeModal(modal);
                    }
                }
            }, {
                title: '取消',
                click: function (event, modal) {
                    closeModal(modal);
                }
            }]
        })
    });
    music.addEventListener('click', function () {
        openModal({
            title: '请输入网络音频地址',
            content: '<input type="text" class="link-input" id="music">',
            buttons: [{
                title: '确认',
                class: 'btn-primary',
                click: function (event, modal) {
                    var link = modal.querySelector('.link-input');
                   if (link.value) {
                       sendMessage({
                           text: '',
                           type: 'audio',
                           src: link.value
                       });
                       closeModal(modal);
                   }
                }
            }, {
                title: '取消',
                click: function (event, modal) {
                    closeModal(modal);
                }
            }]
        })
    });

    document.addEventListener('click', function (e) {
        var popup = document.getElementById('free-chat-emotion').parentNode;
        closeTarget(e.target, 'free-chat-popup-wrapper', function () {
        }, function (t) {
            if (popup && hasClass(popup, 'active')) {
                removeClass(popup, 'active');
            }
        });
        closeTarget(e.target, 'free-chat-item-video', function(target) {
            reviewVideo.call({target: target});
        });
        closeTarget(e.target, 'free-chat-item-audio', function(target) {
            reviewAudio.call({target: target});
        });
    });

    file.onchange = upload;
}

function refreshUserList() {

}

function createHistoryComment(comments) {
    forEach(comments, function (v, k) {
        if (v.to.userId === currentChatroom.userId) {
            if (v.from.userId === user.userId) {
                createItem('me', v);
            } else {
                createItem('you', v);
            }
        }
    })
}

function createUserItem(data, isInCommenting, commenting) {
    var item = document.createElement('div');
    item.className = 'free-chat-item';
    item.setAttribute('data-id', data.userId);
    item.setAttribute('data-type', data.type);
    item.innerHTML = '<div class="free-chat-avatar">' +
        '<img src="' + data.avatar + '">' +
        '</div><div class="free-chat-item-body">' +
        '<div class="free-chat-item-title">' + data.userName + '</div>' +
        '<div class="free-chat-item-subtitle">' + data.motto + '</div>' +
        '</div><span class="free-chat-badge">1</span>';
    if (isInCommenting && data.userId === currentChatroom.userId) {
        addClass(item, 'active');
    }
    addEventListener(item, 'click', function () {
        var id = this.getAttribute('data-id');
        var type = this.getAttribute('data-type');
        var objectStore;
        var isExited;
        var commentingObjectStore = getObjectStore(db.result, 'chatCommenting');
        var firstElem = chatCommenting.firstElementChild;
        body.innerHTML = '';
        currentChatroom = data;
        if (type === 'all') {
            objectStore = getObjectStore(db.result, 'chatGroup');
        } else {
            objectStore = getObjectStore(db.result, 'chatFriend');
        }
        get(objectStore, id, function (event) {
            var item = event.target.result;
            if (item) {
                createHistoryComment(item.commenting);
            }
        });
        if (!isInCommenting) {
            forEach(commenting, function (m, key) {
                if (m.userId === id) {
                    isExited = true;
                }
            });
            if (!isExited) {
                insertBefore(firstElem.parentNode, createUserItem(data, true, commenting), firstElem);
                commenting.push(data);
                nameElem.value = data.motto;
                userAvatar.src = data.avatar;
                commentingObjectStore.add(data);
            }
            moveToTop(id);
            navClickTo(0);
        }
    });
    return item;
}

function moveToTop(index) {
    var items = chatCommenting.querySelectorAll('.free-chat-item');
    var firstElem = chatCommenting.firstElementChild;
    forEach(items, function(item, key) {
        removeClass(item, 'active');
        var id = item.getAttribute('data-id');
        if (id === index) {
            insertBefore(firstElem.parentNode, item, firstElem);
            addClass(item, 'active');
        }
    })
}
// upload the image file which to be selected
function upload(event) {
    var files = event.target.files;
    if (files.length > 0) {
        var formData = new FormData();
        formData.append('file', files[0]);
        ajax({
            url: '/api/upload',
            method: 'POST',
            data: formData
        }, function (data) {
            var data = JSON.parse(data);
            restoreSelection();
            var path = data.path.replace('public/', '');
            execCommand('insertHTML', '<img src="' + path + '" class="upload-file">');
        }, function (err) {
            console.log(err);
        })
    }
}

function createEmotion() {
    var emotions = ['1f60a', '1f60b', '1f60c', '1f60d', '1f60e', '1f60f', '1f61a', '1f61b',
        '1f61c', '1f61d', '1f61e', '1f61f', '1f62a', '1f62b', '1f62c',
        '1f62d', '1f62e', '1f62f', '1f600', '1f601', '1f602',
        '1f603', '1f604', '1f605', '1f606', '1f607', '1f608', '1f609',
        '1f610', '1f611', '1f612', '1f613', '1f614', '1f615', '1f616', '1f617', '1f618',
        '1f619', '1f620', '1f621', '1f622', '1f623', '1f624', '1f625', '1f626', '1f627', '1f628',
        '1f629', '1f630', '1f631', '1f632', '1f633', '1f634', '1f635', '1f636', '1f637'
    ];
    var box = document.getElementById('free-chat-emotion');
    emotions.forEach(function (v, k) {
        var emotion = document.createElement('img');
        emotion.className = 'free-chat-emotion';
        emotion.src = '/emotion/' + v + '.svg';
        box.appendChild(emotion);
        emotion.addEventListener('click', function (e) {
            var img = '<img class="free-chat-emotion" src="' + this.src + '">';
            e.stopPropagation();
            if (selectedRange) {
                closeAllPopup();
                restoreSelection();
                execCommand('insertHTML', img);
            }
        });
    })
}
//  send a message
function sendMessage(media) {
    var mediaElem;
    if (media) {
        if (media.type === 'video') {
            mediaElem = '<span class="free-chat-item-video" data-src="'
                + media.src + '"><i class="ion-ios-play"></i></span>';
        } else {
            mediaElem = '<span class="free-chat-item-audio" data-src="'
                + media.src + '"><i class="ion-ios-play"></i><audio class="free-chat-audio"></audio></span>';
        }
    }
    var data = {
        text: mediaElem ? mediaElem : text.innerHTML,
        date: new Date(),
        from: user,
        to: currentChatroom
    };
    if (media) {
        createItem('me', data, media);
    } else {
        createItem('me', data);
    }
    socket.emit('send', data);
    putComment(data);
    text.innerHTML = '';
}
// put the message to indexeddb
function putComment(data) {
    var objectStore;
    if (currentChatroom.type === 'all') {
        objectStore = getObjectStore(db.result, 'chatGroup');
    } else {
        objectStore = getObjectStore(db.result, 'chatFriend');
    }
    get(objectStore, currentChatroom.userId, function (event) {
        var item = event.target.result;
        if (item) {
            item.commenting.push(data);
            put(objectStore, item, function (event) {
                //console.log(event.target.result);
            });
            var commentingObjectStore = getObjectStore(db.result, 'chatCommenting');
            put(commentingObjectStore, item, function (event) {
                //console.log(event.target.result);
            });
        }
    });
}

// create a message
function createItem(type, data, media) {
    var item = document.createElement('div');
    var mediaElem = '';
    addClass(item, 'free-chat-item ' + 'free-chat-user-' + type);
    if (media) {
        if (media.type === 'video') {
            mediaElem = '<span class="free-chat-item-video" onclick="reviewVideo()" data-src="'
                + media.src + '"><i class="ion-ios-play"></i></span>';
        } else {
            mediaElem = '<span class="free-chat-item-audio" onclick="reviewAudio()" data-src="'
                + media.src + '"><i class="ion-ios-play"></i><audio class="free-chat-audio"></audio></span>';
        }
    }
    item.innerHTML = ' <div class="free-chat-avatar">'
        + '<img src="' + data.from.avatar + '" alt="">'
        + '</div>'
        + '<div class="free-chat-item-body free-chat-message"><div class="free-chat-message-title">'
        + data.from.userName + ' <span>' + formatDate(data.date) + '</span> </div>'
        + '<div class="free-chat-message-content">'
        + (mediaElem || data.text)
        + '</div></div>';
    body.appendChild(item);
    item.addEventListener('click', onItemClick);
    scrollToBottom();
}
// play or pause the video
function reviewVideo() {
   if (this && this.target) {
       var src = this.target.getAttribute('data-src');
       openModal({
           title: '视频播放',
           content: '<video class="free-chat-video" src="' + src + '" controls>',
           buttons: [{
               title: '取消',
               click: function (event, modal) {
                   closeModal(modal);
               }
           }]
       });
   }
}
// play or pause the audio
function reviewAudio() {
    var src, audio, icon;
    if (this && this.target) {
        src = this.target.getAttribute('data-src');
        audio = this.target.querySelector('audio');
        icon = this.target.querySelector('i');
        if (audio.paused) {
            icon.className = 'ion-ios-pause';
            audio.src = src;
            audio.onloadedmetadata = function() {
                audio.play();
            }
        } else {
            icon.className = 'ion-ios-play';
            audio.pause();
        }
    }
}
// create a user or get the user
function getUser() {
    var name = localStorage.getItem('chat-user');
    if (!name) {
        name = {
            userName: 'Customer' + getRandom(),
            userId: getRandom(),
            motto: 'Hi',
            avatar: 'images/avatar/' + Math.floor((Math.random() * 4 + 1)) + '.jpg'
        };
        localStorage.setItem('chat-user', JSON.stringify(name));
    } else {
        name = JSON.parse(name);
    }
    return name;
}

function getRandom(length) {
    length = length || 5;
    var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789';
    var s = '';
    for (var i = 0; i < length; i++) {
        s += str[Math.round(Math.random() * str.length)];
    }
    return s;
}

function onItemClick(event) {
}

function scrollToBottom() {
    body.scrollTop = body.scrollHeight - body.offsetHeight;
}
// format date
function formatDate(date) {
    date = date instanceof Date ? date : new Date(date);
    return formatZero(date.getFullYear())
        + '-' + formatZero(date.getMonth() + 1)
        + '-' + formatZero(date.getDate())
        + ' ' + formatZero(date.getHours())
        + ':' + formatZero(date.getMinutes())
        + ':' + formatZero(date.getSeconds());
}

function formatZero(value) {
    if (parseInt(value, 10) < 10) {
        value = '0' + value;
    }
    return value;
}

function initPopup() {
    var popup = document.querySelectorAll('.free-chat-popup');
    for (var i = 0; i < popup.length; i++) {
        popup[i].addEventListener('click', function (e) {
            e.stopPropagation();
            closeAllPopup();
            this.classList.add('active');
        });
    }
}

function initNav() {
    var navs = document.querySelectorAll('.free-chat-navs .free-chat-nav');
    forEach(navs, function (v, k) {
        (function (index) {
            navs[k].addEventListener('click', function (e) {
                navClickTo(index);
            });
        })(k);
    });
}

// change the nav
function navClickTo(index) {
    var navs = document.querySelectorAll('.free-chat-navs .free-chat-nav');
    forEach(navs, function (nav) {
        nav.classList.remove('active');
    });
    var contents = navs[0].parentNode.nextElementSibling.querySelectorAll('.free-chat-nav-content');
    forEach(contents, function (content, j) {
        content.classList.remove('active');
        if (j === index) {
            content.classList.add('active');
            navs[j].classList.add('active');
        }
    })
}

function closeAllPopup() {
    var popup = document.querySelectorAll('.free-chat-popup');
    for (var i = 0; i < popup.length; i++) {
        popup[i].classList.remove('active');
    }
}

function execCommand(command, param) {
    restoreSelection();
    text.focus();
    document.execCommand(command, false, param);
    saveSelection();
}

function getCurrentRange() {
    if (window.getSelection) {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            return sel.getRangeAt(0);
        }
    } else if (document['selection']) {
        const sel = document['selection'];
        return sel.createRange();
    }
    return null;
}

function saveSelection() {
    const range = getCurrentRange();
    selectedRange = range;
}

function restoreSelection() {
    const selection = window.getSelection();
    try {
        selection.removeAllRanges();
    } catch (ex) {
        document.body['createTextRange']().select();
        document['selection'].empty();
    }
    selection.addRange(selectedRange);
}

// create a modal and open it
function openModal(options) {
    if (!options) {
        return;
    }
    var modal = document.createElement('div');
    var header = document.createElement('div');
    var body = document.createElement('div');
    var footer = document.createElement('div');
    var overlay = document.createElement('div');
    overlay.className = 'free-overlay';
    modal.className = 'free-modal';
    modal.style.zIndex = zIndex++;
    body.className = 'free-modal-body';
    header.className = 'free-modal-header';
    footer.className = 'free-modal-footer';
    header.innerHTML = options.title || 'Tip';
    body.innerHTML = options.content;
    if (options.buttons) {
        forEach(options.buttons, function (v, k) {
            var button;
            if (v.click) {
                button = createButton(v, modal, v.click);
            } else {
                button = createButton(v, modal);
            }
            footer.appendChild(button);
        })
    }
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    var clientWidth = modal.clientWidth;
    modal.classList.add('open');
    return modal;
}

// close the open modal
function closeModal(modal) {
    if (!modal) {
        return;
    }
    document.body.removeChild(document.body.querySelector('.free-overlay'));
    document.body.removeChild(modal);
}

// create a button
function createButton(options, modal, click) {
    var button = document.createElement('button');
    button.className = 'btn';
    button.innerHTML = options.title;
    if (options.class) {
        button.classList.add(options.class);
    } else {
        button.classList.add('btn-default');
    }
    if (click) {
        button.addEventListener('click', function (event) {
            click(event, modal);
        });
    }
    return button;
}