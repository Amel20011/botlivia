const fs = require('fs')
const db = JSON.parse(fs.readFileSync('./database.json'))

const saveDB = () => {
    fs.writeFileSync('./database.json', JSON.stringify(db, null, 2))
}

exports.lockGroup = async (sock, from) => {
    db.groups[from] = db.groups[from] || {}
    db.groups[from].lock = true
    saveDB()

    await sock.sendMessage(from, {
        image: fs.readFileSync('./media/thumb.jpg'),
        caption: '🔐 *GROUP DIKUNCI*\n\nHanya admin yang bisa chat.',
        footer: 'LIVIAA BOT',
        buttons: [
            { buttonId: '#unlockgroup', buttonText: { displayText: '🔓 Unlock Group' }, type: 1 }
        ],
        headerType: 4
    })
}

exports.unlockGroup = async (sock, from) => {
    db.groups[from].lock = false
    saveDB()

    await sock.sendMessage(from, {
        image: fs.readFileSync('./media/thumb.jpg'),
        caption: '🔓 *GROUP DIBUKA*\n\nSemua member bisa chat.',
        footer: 'LIVIAA BOT',
        buttons: [
            { buttonId: '#lockgroup', buttonText: { displayText: '🔐 Lock Group' }, type: 1 }
        ],
        headerType: 4
    })
}

exports.securityCheck = async (sock, msg) => {
    const from = msg.key.remoteJid
    const sender = msg.key.participant
    if (!db.groups[from]?.lock) return

    const meta = await sock.groupMetadata(from)
    const admins = meta.participants.filter(p => p.admin).map(p => p.id)

    if (!admins.includes(sender)) {
        await sock.groupParticipantsUpdate(from, [sender], 'remove')
    }
}

exports.welcome = async (sock, update) => {
    for (let user of update.participants) {
        await sock.sendMessage(update.id, {
            video: fs.readFileSync('./media/welcome.mp4'),
            caption: `🦋✨ Welcome @${user.split('@')[0]}`,
            mentions: [user]
        })
    }
}
