import { templates, select, settings, classNames } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.tableSelected = '';

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData() {
    const thisBooking = this;

    const startDateParam =
			settings.db.dateStartParamKey +
			'=' +
			utils.dateToStr(thisBooking.datePicker.minDate);

    const endDateParam =
			settings.db.dateEndParamKey +
			'=' +
			utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      bookings: [startDateParam, endDateParam],
      eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
      eventsRepeat: [settings.db.repeatParam, endDateParam],
    };

    const urls = {
      bookings:
				settings.db.url +
				'/' +
				settings.db.bookings +
				'?' +
				params.bookings.join('&'),

      eventsCurrent:
				settings.db.url +
				'/' +
				settings.db.events +
				'?' +
				params.eventsCurrent.join('&'),

      eventsRepeat:
				settings.db.url +
				'/' +
				settings.db.events +
				'?' +
				params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.bookings),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        //console.log(bookings);
        //console.log(eventsCurrent);
        //console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (
          let loopDate = minDate;
          loopDate <= maxDate;
          loopDate = utils.addDays(loopDate, 1)
        ) {
          thisBooking.makeBooked(
            utils.dateToStr(loopDate),
            item.hour,
            item.duration,
            item.table
          );
        }
      }
    }

    //console.log('thisBookingBooked', thisBooking.booked);
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (
      let hourBlock = startHour;
      hourBlock < startHour + duration;
      hourBlock += 0.5
    ) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
			typeof thisBooking.booked[thisBooking.date][thisBooking.hour] ==
				'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable &&
				thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  render(element) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = element.querySelector(
      select.booking.peopleAmount
    );
    thisBooking.dom.hoursAmount = element.querySelector(
      select.booking.hoursAmount
    );
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.datePicker.wrapper
    );
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.hourPicker.wrapper
    );

    thisBooking.dom.tables = element.querySelectorAll(select.booking.tables);
    // w setting.js floor-plan musiałem wyciągnąć do nowej właściwości bo nie potrafiłem odczyta z tables
    thisBooking.dom.floorPlan = element.querySelector(select.booking.floorPlan);

    thisBooking.dom.form = element.querySelector('.booking-form');
    thisBooking.dom.phone = element.querySelector('.booking-form [name="phone"]');
    thisBooking.dom.address = element.querySelector('.booking-form [name="address"]');
    thisBooking.dom.starters = element.querySelectorAll('.booking-form [name="starter"]');
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });

    thisBooking.dom.floorPlan.addEventListener('click', function (event) {
      event.preventDefault();
      thisBooking.initTables(event);
    });

    thisBooking.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }

  initTables(event) {
    const thisBooking = this;
    if (
      event.target.classList.contains('table') &&
			!event.target.classList.contains(classNames.booking.tableBooked)
    ) {
      if (!event.target.classList.contains('selected')) {
        event.target.classList.add('selected');
        thisBooking.tableSelected = event.target.getAttribute('data-table');
      } else {
        event.target.classList.remove('selected');
        thisBooking.tableSelected = '';
      }
      for (let table of thisBooking.dom.tables) {
        let activeTable = table.getAttribute(settings.booking.tableIdAttribute);
        if (activeTable !== thisBooking.tableSelected) {
          table.classList.remove('selected');
        }
      }
    } else if (
      event.target.classList.contains('table') &&
			event.target.classList.contains(classNames.booking.tableBooked)
    ) {
      window.alert('This table is unavailable');
    }
  }

  sendBooking() {
    const thisBooking = this;
    // adres endpointu z którym się łączymy
    const url = settings.db.url + '/' + settings.db.bookings;
    // obiekt, dzięki któremu będziemy wysyłać dane do serwera
    const payload = {};
    payload.date = thisBooking.datePicker.value;
    payload.hour = thisBooking.hourPicker.value;
    payload.table = thisBooking.tableSelected;
    payload.duration = thisBooking.hoursAmount.value;
    payload.ppl = thisBooking.peopleAmount.value;
    payload.starters = [];
    payload.phone = thisBooking.dom.phone.value;
    payload.address = thisBooking.dom.address.value;

    for (let starter in thisBooking.starters){ 
      if (starter.checked){
        payload.starters.push(starter.value);
      }
    }
    console.log(payload);
    thisBooking.send(url, payload);

    thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);
  }
  send(url, payload){
    // wysyłanie do serwera
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    fetch(url, options);
  }
}

export default Booking;
