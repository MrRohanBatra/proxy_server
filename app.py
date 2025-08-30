import requests
from tabulate import tabulate

def main():
    url = "http://127.0.0.1:3000"
    payload = {
        "name": "23104056",
        "pass": "R0hanbatra@16072005"
    }

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()

        data = response.json()
        attendance = data.get("attendance", {})
        attend_list = attendance.get("studentattendancelist", [])

        if not attend_list:
            print("No attendance data found.")
            return

        # Build table rows
        table = []
        for subj in attend_list:
            subject = subj.get("subjectcode", "Unknown")
            attended = subj.get("Ltotalpres") or subj.get("Ptotalpres") or subj.get("Ttotalpres") or 0
            total = subj.get("Ltotalclass") or subj.get("Ptotalclass") or subj.get("Ttotalclass") or 0
            percent = subj.get("LTpercantage") or subj.get("Lpercentage") or subj.get("Ppercentage") or subj.get("Tpercentage") or "N/A"
            
            table.append([subject, attended, total, percent])

        headers = ["Subject", "Attended", "Total", "Percentage"]
        print(tabulate(table, headers=headers, tablefmt="pretty"))

    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
