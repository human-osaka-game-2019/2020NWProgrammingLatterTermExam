let isDisplayingAllMessage = false;
let isTopScroll = false;

const limitNum = 12;

const token = 'xoxb-601666621505-1296379835156-QgP0cyKKKyWKuVS9J0hLnsOP';
const channelId = 'C014LC6N4FJ';

let nextCursor = "";

const dayOfWeekStrJP = ["日", "月", "火", "水", "木", "金", "土"];

// 後に修正します。
let oldYearString = "";
let oldDateString = "";
let todayDateString = "";
let todayYearString = "";

const userNameMap = new Map();

const insertMessageElms = (messageElm, isMe) => {

    const messageBoxElm = document.querySelector("#messageBox");

    messageElm.classList.add(isMe ? "botMessage" : "userMessage");

    const oldestMessageElm = messageBoxElm.firstElementChild;

    messageBoxElm.insertBefore(messageElm, oldestMessageElm);
}

const escapeHtml = (text) => {
    return text
        .replace(/&/g, "%26")
        .replace(/</g, "%3C")
        .replace(/>/g, "%3E");
}

const informSlackApiError = (error) => {

    switch (error) {
        case "channel_not_found":
            alert("チャンネル内にbotが存在していない又はチャンネルが存在していません" + "\n" + error);
            break;
        case "invalid_auth":
            alert("無効なトークンです" + "\n" + error);
            break;
        default:
            alert("SlackAPIからエラーが返されました" + "\n" + error);
            break;
    }
}

const insertUserNameElms = (userNameElm, messageElm, message, isMe) => {
    userNameElm.classList.add("user");

    if (!isMe) {
        userNameElm.textContent = userNameMap.get(message.user).name;
    }

    userNameElm = messageElm.appendChild(userNameElm);
}

const insertIconElms = (message, iconElm, messageLevl2Elm, isMe) => {

    if (!isMe) {
        const iconUrl = userNameMap.get(message.user).icon;
        iconElm.classList.add("icon");
        iconElm.style.backgroundImage = `url(${iconUrl})`;
        iconElm.style.left = "0.3vw";

        iconElm = messageLevl2Elm.appendChild(iconElm);
    }
};

const insertMessageLevl2Elms = (messageLevl2Elm, messageElm) => {

    messageLevl2Elm.classList.add("messageLevl2");

    messageLevl2Elm = messageElm.appendChild(messageLevl2Elm);
}

const insertTextBoxElms = (message, textBoxElm, messageLevl2Elm, isMe) => {

    textBoxElm.classList.add(isMe ? "myTextBox" : "textBox");

    if ('blocks' in message && 'text' in message.blocks[0]) {
        textBoxElm.innerText = message.blocks[0].text["text"];
    }
    if (textBoxElm.innerText == "") {
        textBoxElm.innerText = message.text;
    }

    textBoxElm = messageLevl2Elm.appendChild(textBoxElm);
}

const insertTimeStampElms = (timeStampElm, messageLevl2Elm, message) => {

    timeStampElm.classList.add("timeStamp");

    const messageDate = new Date(message.ts * 1000);
    let messagePostTime = "";

    messagePostTime += messageDate.getHours() + ":";

    messagePostTime += ('00' + messageDate.getMinutes()).slice(-2);

    timeStampElm.innerText = messagePostTime;

    timeStampElm = messageLevl2Elm.appendChild(timeStampElm);
}

const insertDateElms = (dateElm, oldDateString, todayDateString, messageYearString, todayYearString) => {
    const messageBoxElm = document.querySelector("#messageBox");

    dateElm.classList.add("messageDate");

    const oldestMessageElm = messageBoxElm.firstElementChild;

    if (messageYearString == todayYearString) {
        if (oldDateString == todayDateString) {
            dateElm.innerText = "今日";
        } else {
            dateElm.innerText = oldDateString;
        }
    } else {
        dateElm.innerText = messageYearString + oldDateString;
    }

    messageBoxElm.insertBefore(dateElm, oldestMessageElm);
}

const getUserName = () => {

    const xhr = new XMLHttpRequest();

    xhr.open("GET", `https://slack.com/api/users.list?token=${token}`, false);

    xhr.send(null);

    const responseObj = JSON.parse(xhr.responseText);
    if (!responseObj.ok) {

        informSlackApiError(responseObj.error);

        return;
    }

    responseObj.members.forEach((value) => {
        userNameMap.set(value.id, {
            name: value.real_name,
            icon: value.profile.image_192
        });
    });
}

const getIsMe = (message) => {
    const user = userNameMap.get(message.user).name;

    return user == "NWプログラミングbot";
}

const getDate = (dateString, date) => {

    dateString += (date.getMonth() + 1) + '月';
    dateString += date.getDate() + '日';
    dateString += '(' + dayOfWeekStrJP[date.getDay()] + ')';

    return dateString;
}

const getPostDate = (messagePostDateString, message) => {
    const messagePostDate = new Date(message.ts * 1000);
    
    return getDate(messagePostDateString, messagePostDate);
}

const getToDayDate = (todayDateString) => {
    const todayDate = new Date();

    return getDate(todayDateString, todayDate);
}

const getPostYear = (messagePostYearString, message) => {
    const messageDate = new Date(message.ts * 1000);
    messagePostYearString = messageDate.getFullYear() + '年';

    return messagePostYearString;
}

const getToDayYear = (todayYearString) => {
    const todayDate = new Date();
    todayYearString = todayDate.getFullYear() + '年';

    return todayYearString;
}

const getMessage = () => {

    const xhr = new XMLHttpRequest();

    let url = `https://slack.com/api/conversations.history?token=${token}&channel=${channelId}&limit=${limitNum}`;

    if (nextCursor != "") {

        url += '&cursor=' + nextCursor;
    }

    xhr.open("GET", url, true);

    xhr.send(null);

    xhr.onload = () => {

        const responseObj = JSON.parse(xhr.responseText);

        if (!responseObj.ok) {
            informSlackApiError(responseObj.error);

            return;
        }

        if (responseObj.response_metadata != null) {
            nextCursor = responseObj.response_metadata.next_cursor;
        } else {
            nextCursor = null;
            isDisplayingAllMessage = true;
        }

        todayYearString = getToDayYear(todayYearString);
        todayDateString = getToDayDate(todayDateString);

        addMessages(responseObj.messages);

    }

}

const addMessages = (messages) => {

    const messageBoxElm = document.querySelector("#messageBox");

    const oldestMessageElm = messageBoxElm.firstElementChild;

    const messageCount = messages.length;

    for (let i = 0; i < messageCount; i++) {

        let messagePostDateString = "";
        let messagePostYearString = "";

        messagePostYearString = getPostYear(messagePostYearString, messages[i]);
        messagePostDateString = getPostDate(messagePostDateString, messages[i]);

        if (oldDateString == "") {

            oldYearString = messagePostYearString;
            oldDateString = messagePostDateString;

        } else {

            if (messagePostDateString != oldDateString) {

                const dateElm = document.createElement("div");
                insertDateElms(dateElm, oldDateString, todayDateString, oldYearString, todayYearString);
                oldYearString = messagePostYearString;
                oldDateString = messagePostDateString;
                
            } 
        }

        const isMe = getIsMe(messages[i]);

        const messageElm = document.createElement("div");
        insertMessageElms(messageElm, isMe);

        const userNameElm = document.createElement("div");
        insertUserNameElms(userNameElm, messageElm, messages[i], isMe);

        const messageLevl2Elm = document.createElement("div");
        insertMessageLevl2Elms(messageLevl2Elm, messageElm);

        const iconElm = document.createElement("div");
        insertIconElms(messages[i], iconElm, messageLevl2Elm, isMe);

        if (isMe) {
            const timeStampElm = document.createElement("div");
            insertTimeStampElms(timeStampElm, messageLevl2Elm, messages[i]);

            const textBoxElm = document.createElement("div");
            insertTextBoxElms(messages[i], textBoxElm, messageLevl2Elm, isMe);
        } else {
            const textBoxElm = document.createElement("div");
            insertTextBoxElms(messages[i], textBoxElm, messageLevl2Elm, isMe);

            const timeStampElm = document.createElement("div");
            insertTimeStampElms(timeStampElm, messageLevl2Elm, messages[i]);
        }
    }

    if (isDisplayingAllMessage) {

        const dateElm = document.createElement("div");
        insertDateElms(dateElm, oldDateString, todayDateString, oldYearString, todayYearString);
    }

    if (!isTopScroll) {
        // 最初に読み込まれた時、メッセージ追加後にスクロール位置を一番下まで移動する
        messageBoxElm.scroll(0, messageBoxElm.scrollHeight);
    } else {
        /*
          一番上にスクロールした時、メッセージ追加後の画面表示が変わらないようにする為に、
          スクロール実行前に表示されていたメッセージの中で
          一番古いメッセージが画面上端にくるようにスクロール位置を移動する
          
          これにより、LINEのように古いメッセージを見ることができる
        */
        oldestMessageElm.scrollIntoView();
        isTopScroll = false;
    }

}

const addNewLine = () => {

    const inputAreaElm = document.querySelector("#inputArea");

    const allInputText = inputAreaElm.value;

    const cursorPos = inputAreaElm.selectionStart;

    const textBeforeCursor = allInputText.substr(0, cursorPos);
    const textAfterCursor = allInputText.substr(cursorPos, allInputText.length);

    const textWithNewLine = textBeforeCursor + '\n' + textAfterCursor;

    if (textWithNewLine.length <= inputAreaElm.maxLength) {

        inputAreaElm.value = textWithNewLine;

        inputAreaElm.selectionStart = cursorPos + 1;
        inputAreaElm.selectionEnd = cursorPos + 1;

    }

}

const postMessage = () => {

    const inputAreaElm = document.querySelector("#inputArea");

    const urlEscapedValue = escapeHtml(inputAreaElm.value);

    const blocks = [{
        type: "section",
        text: {
            type: "mrkdwn",
            text: urlEscapedValue
        }
    }];

    const xhr = new XMLHttpRequest();

    xhr.open("GET", `https://slack.com/api/chat.postMessage?token=${token}&channel=${channelId}&text=${urlEscapedValue}&blocks=${JSON.stringify(blocks)}&pretty=1`, true);

    inputAreaElm.value = "";

    xhr.send(null);

    xhr.onload = () => {

        const responseObj = JSON.parse(xhr.responseText);

        if (!responseObj.ok) {
            informSlackApiError(responseObj.error);

            return;
        }

        location.reload();

    }
}

window.onload = () => {
    const messageBoxElm = document.querySelector("#messageBox");

    getUserName();
    getMessage();

    messageBoxElm.onscroll = () => {

        if (messageBoxElm.scrollTop !== 0) return;

        isTopScroll = true;

        if (isDisplayingAllMessage) return;

        getMessage();

    };

    const inputAreaElm = document.querySelector("#inputArea");

    inputAreaElm.onkeydown = (e) => {

        if (e.code != "Enter" || e.isComposing) return;

        if (e.ctrlKey) {
            addNewLine();
        } else {
            postMessage();
        }
    };
}
