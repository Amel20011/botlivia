const fs = require('fs')

exports.sendButton = async (sock, jid, text, buttons, footer, quoted) => {
    return await sock.sendMessage(jid, {
        image: fs.readFileSync('./media/thumb.jpg'),
        caption: text,
        footer: footer,
        buttons: buttons,
        headerType: 4
    }, { quoted })
}
