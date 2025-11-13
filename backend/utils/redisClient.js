// Redis support removed. Keep a harmless stub to avoid crashes if referenced.

function createClient() {
    throw new Error('Redis has been removed from this project. No client available.');
}

module.exports = { createClient };
