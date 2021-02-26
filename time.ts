import moment from "moment";

export function getPreviousSunday(): Date {
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
    start.setHours(15,0,0);
    end.setHours(15,0,0);
    let currentMoment = moment(start);
    let endMoment = moment(end);
    let arr=[]

    while (currentMoment <= endMoment) {
      arr.push(moment(currentMoment).format('YYYY-MM-DD'));
      currentMoment = moment(currentMoment).add(1, 'days');
    }
    return arr;
};

export function getPastYearArray(): string[] {
    let today = new Date();
    let prev_sunday = getPreviousSunday()
    let start_day = countBackDays(prev_sunday, 52 * 7)

    return getDaysArray(start_day, today);
};
