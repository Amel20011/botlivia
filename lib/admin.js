exports.antiLink = async (sock, msg) => {
    const text = msg.message?.conversation || ''
    if (!text.includes('chat.whatsapp.com')) return

    const from = msg.key.remoteJid
    const sender = msg.key.participant

    const meta = await sock.groupMetadata(from)
    const admins = meta.participants.filter(p => p.admin).map(p => p.id)

    if (!admins.includes(sender)) {
        await sock.groupParticipantsUpdate(from, [sender], 'remove')
    }
}
