function getPreviousSunday(): Date {
    let today = new Date();
    let sunday = new Date();
    sunday.setDate(today.getDate() - today.getDay());
    return sunday;
};

export function countBackDays(day: Date, daysToCountBack: number): Date {
    let past_date = new Date(day)
    for (let i = 0; i < daysToCountBack; i++) {
        past_date.setDate(past_date.getDate() - 1)
    }
    return past_date;
};

function getDaysArray(start: Date, end: Date): Date[] {
    let arr=[]
    for(let dt=new Date(start); dt<=end; dt.setDate(dt.getDate()+1)){
        arr.push(new Date(dt));
    }
    return arr;
};

export function getPastYearArray(): string[] {
    let today = new Date();
    let prev_sunday = getPreviousSunday()
    let start_day = countBackDays(prev_sunday, 52 * 7)

    return getDaysArray(start_day, today).map((date) => date.toISOString().slice(0,10))
};