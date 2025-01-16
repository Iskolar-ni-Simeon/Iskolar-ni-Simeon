fetch("https://www.deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1", {
    method: "GET",
}).then(response => {
    if (!response.ok) {
        console.log("hindi siya okay :(")
    }
    return response.json()
}).then(data => {
    console.log(data.shuffled)
}).catch(err => {
    console.log(`Error: ${err}`)
})