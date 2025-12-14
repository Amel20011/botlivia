exports.ownerOnly = (owner, sender) => {
    return owner.includes(sender.split('@')[0])
}
