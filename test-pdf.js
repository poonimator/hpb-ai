const fs = require('fs');
const pdf = require('pdf-parse');

async function test() {
    try {
        console.log("pdf-parse required successfully:", typeof pdf === "function");
    } catch (e) {
        console.error(e);
    }
}
test();
