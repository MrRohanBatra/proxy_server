async function main() {
    const response = await fetch("http://127.0.0.1:3000", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: "23104056",
            pass: "R0hanbatra@16072005"
        })
    });

    if (response.ok) {
        const data = await response.json(); // parse JSON response
        attend=data.attendance.studentattendancelist;
        attend.forEach(element => {
            console.log(element)
        });
    } else {
        console.error("Request failed:", response.status);
    }
}

main();
