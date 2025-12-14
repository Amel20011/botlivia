const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require('@whiskeysockets/baileys')

const fs = require('fs')
const Pino = require('pino')
const config = require('./config')
const db = JSON.parse(fs.readFileSync('./database.json'))

const { sendButton } = require('./lib/button')
const { lockGroup, unlockGroup, securityCheck, welcome } = require('./lib/group')
const { antiLink } = require('./lib/admin')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(config.sessionName)

    const sock = makeWASocket({
        logger: Pino({ level: 'silent' }),
        auth: state
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('group-participants.update', async (update) => {
        if (update.action === 'add') {
            await welcome(sock, update)
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message) return

        const from = msg.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const sender = msg.key.participant || msg.key.remoteJid
        const text = msg.message.conversation || ''
        const command = text.toLowerCase().split(' ')[0]

        if (isGroup) {
            await securityCheck(sock, msg)
            await antiLink(sock, msg)
        }

        if (!db.users[sender] && command !== '#daftar') {
            const daftar = fs.readFileSync('./media/menu_daftar.txt', 'utf-8')
            return await sendButton(
                sock,
                from,
                daftar,
                [{ buttonId: '#daftar', buttonText: { displayText: '🦋 Daftar Member' }, type: 1 }],
                config.footer,
                msg
            )
        }

        if (command === '#daftar') {
            const data = text.split(' ')[1]
            if (!data || !data.includes('.')) return

            const [nama, umur] = data.split('.')
            db.users[sender] = { nama, umur }
            fs.writeFileSync('./database.json', JSON.stringify(db, null, 2))

            return await sendButton(
                sock,
                from,
                `🌷 *Pendaftaran Berhasil!*\n\nHalo ${nama}, akun kamu sudah aktif.`,
                [
                    { buttonId: '#menu', buttonText: { displayText: '📋 Buka Menu' }, type: 1 },
                    { buttonId: '#produk', buttonText: { displayText: '🛒 Lihat Produk' }, type: 1 }
                ],
                config.footer,
                msg
            )
        }

        if (command === '#menu') {
            const menu = fs.readFileSync('./media/allmenu.txt', 'utf-8')
            await sendButton(sock, from, menu, [], config.footer, msg)
        }

        if (command === '#lockgroup' && isGroup) await lockGroup(sock, from)
        if (command === '#unlockgroup' && isGroup) await unlockGroup(sock, from)
    })
}

startBot()
