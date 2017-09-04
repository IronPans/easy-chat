/*
 * options: {
 *   dir: '文字的方向；它的值可以是 auto（自动）, ltr（从左到右）, or rtl（从右到左）',
 *   icon: '一个图片的URL，将被用于显示通知的图标。',
 *   body: '通知中额外显示的字符串',
 *   lang: '指定通知中所使用的语言',
 *   tag: '赋予通知一个ID，以便在必要的时候对通知进行刷新、替换或移除。'
 * }
 * */
function requestNotification(title, options, callback) {
    title = title || 'Tip';
    options = options || {};
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
    } else if (Notification.permission === "granted") {
        var notification = new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
            if (permission === "granted") {
                var notification = new Notification(title, options);
                if (callback) {
                    callback(notification);
                }
            }
        });
    }
}