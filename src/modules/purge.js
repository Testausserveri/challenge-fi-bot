const { Interaction } = require("discord.js")
const check_for_access = require("../utils/check_for_access.js")
/**
 * Purge messages from a channel
 * @param {Interaction} interaction 
 */
module.exports = async interaction => {
    if(interaction.commandName === "purge"){
        // Check for access
        if(!check_for_access(interaction)){
            interaction.reply({
                content: "Permission denied.",
                ephemeral: true
            })
            return
        }

        // The 500 messages at once maximum is not required, but a measure to avoid API rate limiting
        const count = parseInt(interaction.options._hoistedOptions.filter(option => option.name === "count")[0].value)
        const userId = interaction.options._hoistedOptions.filter(option => option.name === "user-id")[0]?.value
        if(count < 500){
            await interaction.reply({
                content: "Deleting messages...",
                type: 5,
                ephemeral: true
            })
            const remove = async count => {
                count = count - 100
                let limit = 100
                if(count < 0) limit = 100 - Math.abs(count)
                const messages = await interaction.channel.messages.fetch({ limit })
                for(const message of messages){
                    if(userId){
                        if(message[1].author.id == userId) await message[1].delete()
                        else count = count + 1
                    }else {
                        await message[1].delete()
                    }
                }
                if(count > 0) await remove(count)
                return
            }
            await remove(count)
            interaction.followUp({
                content: count + " messages removed.",
                ephemeral: true
            })
        }else {
            interaction.reply({
                content: "You are trying to delete too many messages (max 500).",
                ephemeral: true
            })
        }
    }
}