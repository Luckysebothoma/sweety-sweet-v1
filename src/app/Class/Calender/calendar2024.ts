export class Calendar2024 {
    weeks: { [week: number]: string[] };
    months: { [month: number]: string[] };

    constructor() {
        this.weeks = {};
        this.months = {};
    }

    generateCalendar() {
        // Generate weeks
        for (let week = 1; week <= 52; week++) {
            const startDate = this.getDateOfWeek(2024, week, 1);
            const weekDays: string[] = [];
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + day);
                weekDays.push(this.formatDate(currentDate));
            }
            this.weeks[week] = weekDays;
        }

        // Generate months
        for (let month = 1; month <= 12; month++) {
            const startDate = new Date(2024, month - 1, 1);
            const endDate = new Date(2024, month, 0);
            const monthDays: string[] = [];
            for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
                monthDays.push(this.formatFullDate(currentDate));
            }
            this.months[month] = monthDays;
        }
    }

    getDateOfWeek(year: number, week: number, dayOfWeek: number) {
        const firstDayOfYear = new Date(year, 0, 1);
        const daysToAdd = (week - 1) * 7 + (dayOfWeek - 1);
        const result = new Date(firstDayOfYear);
        result.setDate(firstDayOfYear.getDate() + daysToAdd);
        return result;
    }
    formatFullDate(date: Date) {
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' };
        const formattedDate = date.toLocaleDateString('en-GB', options);
        return formattedDate;
    }
    
    
    
    
    

    formatDate(date: Date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }
}
/*
const calendar2024 = new Calendar2024();
console.log("Weeks:");
console.log(calendar2024.weeks);
console.log("\nMonths:");
console.log(calendar2024.months);
*/