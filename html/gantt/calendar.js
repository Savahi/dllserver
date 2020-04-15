var _calendar = null
var _calendarDayChosen = null;
var _calendarContainer = null
var _calendarCallBack = null

var _calendarFormat = { 'dateOnly':false };

var _calendarMonthArray = [ 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC' ];

function calendarGetFormat() {
	return _calendarFormat;
}

function calendarSetFormat( format ) {
	if( typeof(format) === 'undefined' ) {
		return;
	}
	if( format === null ) {
		return;
	}
	if( 'dateOnly' in format ) {
		_calendarFormat.dateOnly = format.dateOnly;			
	}
}

function calendar( container, callBack, cellWidth, cellHeight, date, monthArray=null ) {
	if( _calendar !== null ) {
		_calendarContainer.removeChild(_calendar);
		_calendar = null;
		container.style.display = 'none';					
		return;
	}
	if( monthArray ) {
		_calendarMonthArray = monthArray;
	}
	calendarInit( container, callBack, cellWidth, cellHeight );
	calendarSetDate( date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() );
}

function calendarCancel() {
	if( _calendar !== null ) {
		_calendarContainer.removeChild(_calendar);
		_calendar = null;
		_calendarContainer.style.display = 'none';					
	}
}


function calendarIsActive() {
	if( _calendar !== null ) {
		return true;
	}
	return false;
}


function calendarInit( container, callBack, cellWidth, cellHeight ) {
	if( _calendar !== null ) {
		return;
	}
	container.style.display = 'block';

	_calendar = document.createElement("div");
	_calendar.style.width = (cellWidth*7+4) + 'px';
	_calendar.style.height = (cellHeight*8+4) + 'px';
	_calendar.style.border = '3px solid #808080';
	_calendar.style.boxSizing = 'content-box';
	_calendar.style.backgroundColor = '#ffffff';
	_calendar.style.position = 'relative';


	let yearInput = document.createElement("input");
	yearInput.setAttribute( 'id', `calendar-year` );
	yearInput.style.position = 'absolute';
	yearInput.style.top = '2px';
	yearInput.style.left = (cellWidth*4+2) + 'px';
	yearInput.style.width = cellWidth*3 + 'px';
	yearInput.style.height = cellHeight + 'px';
	yearInput.style.fontSize = parseInt(4*cellHeight/7) + 'px';
	yearInput.style.border = '0px';
	yearInput.style.margin = '0px';
	yearInput.style.padding = '0px';
	yearInput.value = '2000';
	yearInput.setAttribute('type','number');
	yearInput.setAttribute('min','1970');
	yearInput.setAttribute('max','2100');
	yearInput.setAttribute('step','1');
	yearInput.onchange = function() {
		calendarDisplay( this.value, document.getElementById('calendar-month').value );
	};
	_calendar.appendChild(yearInput);

	let monthInput = document.createElement("select");
	monthInput.setAttribute( 'id', `calendar-month` );
	monthInput.style.position = 'absolute';
	monthInput.style.top = '2px';
	monthInput.style.left = '2px';
	monthInput.style.width = cellWidth*4 + 'px';
	monthInput.style.height = cellHeight + 'px';
	monthInput.style.fontSize = parseInt(4*cellHeight/7) + 'px';
	monthInput.style.border = '0px';
	monthInput.style.margin = '0px';
	monthInput.style.padding = '0px';
	for( let m = 0 ; m < _calendarMonthArray.length ; m++ ) {
	    let option = document.createElement("option");
	    option.value = m;
	    option.text = _calendarMonthArray[m];
	    monthInput.appendChild(option);
	}		
	monthInput.value = 0;
	monthInput.setAttribute('class','noArrow');		
	monthInput.onchange = function() {
		calendarDisplay( document.getElementById('calendar-year').value, this.value );
	};
	_calendar.appendChild(monthInput);

	for( let w = 0 ; w < 6 ; w++ ) {
		for( let d = 0 ; d < 7 ; d++ ) {
			let day = document.createElement("div");
			day.setAttribute( 'id', `calendar-w${w}-d${d}` );
			day.style.position = 'absolute';
			day.style.top = ((w+1)*cellHeight+2) + 'px';
			day.style.left = (d*cellWidth+2) + 'px';
			day.style.width = cellWidth + 'px';
			day.style.height = cellHeight + 'px';
			day.style.border = '1px dotted #dfdfdf';
			day.style.margin = '0px';
			day.style.padding = '0px';
			day.style.textAlign = 'center';
			day.style.fontSize = parseInt(4*cellHeight/7) + 'px';
			day.style.backgroundColor = '#ffffff';
			day.style.cursor = 'pointer';
			day.onclick = function(e) {
				//calendarSetDate(null, null, parseInt(this.childNodes[0].textContent));
				let y = document.getElementById('calendar-year').value;
				let m = parseInt(document.getElementById('calendar-month').value);
				let d = parseInt(this.childNodes[0].textContent);
				if( isNaN(d) ) {
					return;
				}
				_calendarDayChosen = d;
				let hr;
				let mn;
				if( !_calendarFormat.dateOnly ) {
					hr = document.getElementById('calendar-hour').value;
					mn = document.getElementById('calendar-minute').value;						
				} else {
					hr = 0;
					mn = 0;
				}
				_calendarContainer.removeChild(_calendar);
				_calendar = null;
				container.style.display = 'none';
				let date = new Date( y,m,d,hr,mn,0,0 );
				_calendarCallBack( date );
			}
			day.appendChild( document.createTextNode(d) );
			_calendar.appendChild(day);
		}
	}

	let cancel = document.createElement("div");
	cancel.setAttribute( 'id', `calendar-cancel` );
	cancel.style.position = 'absolute';
	cancel.style.top = (cellHeight*7 + 2 + 1) + 'px';
	cancel.style.left = '2px';
	cancel.style.width = cellWidth*2 + 'px';
	cancel.style.height = cellHeight + 'px';
	cancel.style.fontSize = parseInt(4*cellHeight/6);
	cancel.style.textAlign = 'center';
	cancel.appendChild( document.createTextNode('✖')); // ✕
	cancel.style.cursor = 'pointer';
	cancel.onclick = function(e) {
		_calendarContainer.removeChild(_calendar);
		_calendar = null;
		container.style.display = 'none';
		_calendarCallBack( null );			
	}
	_calendar.appendChild(cancel);

	if( !_calendarFormat.dateOnly ) {
		let hourInput = document.createElement("select");
		hourInput.setAttribute( 'id', `calendar-hour` );
		hourInput.style.position = 'absolute';
		hourInput.style.top = (cellHeight*7 + 2) + 'px';
		hourInput.style.left = (cellWidth*4 + 2) + 'px';
		hourInput.style.width = cellWidth*1 + 'px';
		hourInput.style.height = cellHeight + 'px';
		hourInput.style.border = '0px';
		hourInput.style.margin = '0px';
		hourInput.style.padding = '0px 0px 0px 2px';
		hourInput.style.fontSize = parseInt(3*cellHeight/7);		
		for( let h = 0 ; h < 24 ; h++ ) {
		    let option = document.createElement("option");
		    option.value = h;
		    option.text = (h >= 10) ? h : ('0' + h);
		    hourInput.appendChild(option);
		}		
		hourInput.setAttribute('class','noArrow');
		_calendar.appendChild(hourInput);

		let hourMinuteSeparator = document.createElement("div");
		hourMinuteSeparator.setAttribute( 'id', `calendar-hourMinuteSeparator` );
		hourMinuteSeparator.style.position = 'absolute';
		hourMinuteSeparator.style.top = (cellHeight*7 + 2) + 'px';
		hourMinuteSeparator.style.left = (cellWidth*5 + 2) + 'px';
		hourMinuteSeparator.style.width = cellWidth + 'px';
		hourMinuteSeparator.style.height = cellHeight + 'px';
		hourMinuteSeparator.style.textAlign = 'center';
		hourMinuteSeparator.style.fontSize = parseInt(2*cellHeight/5);
		hourMinuteSeparator.appendChild( document.createTextNode(':'));
		_calendar.appendChild(hourMinuteSeparator);

		let minuteInput = document.createElement("select");
		minuteInput.setAttribute( 'id', `calendar-minute` );
		minuteInput.style.position = 'absolute';
		minuteInput.style.top = (cellHeight*7 + 2) + 'px';
		minuteInput.style.left = (cellWidth*6 + 2) + 'px';
		minuteInput.style.width = cellWidth*1 + 'px';
		minuteInput.style.height = cellHeight + 'px';
		minuteInput.style.border = '0px';
		minuteInput.style.margin = '0px';
		minuteInput.style.padding = '0px 0px 0px 2px';
		minuteInput.style.fontSize = parseInt(3*cellHeight/7);
		for( let m = 0 ; m < 60 ; m++ ) {
		    let option = document.createElement("option");
		    option.value = m;
		    option.text = (m >= 10) ? m : ('0' + m);
		    minuteInput.appendChild(option);
		}		
		minuteInput.setAttribute('class','noArrow');
		_calendar.appendChild(minuteInput);
	}

	_calendarContainer = container;
	_calendarCallBack = callBack;
	_calendarContainer.appendChild(_calendar);
}


function calendarSetDate( year=null, month=null, day=null, hour=null, minute=null ) {
	if( year !== null ) {
		document.getElementById('calendar-year').value = year;
	} else {
		year = parseInt(document.getElementById('calendar-year').value);
	}
	if( month !== null ) {
		document.getElementById('calendar-month').value = month;	
	} else {
		month = parseInt(document.getElementById('calendar-month').value);
	}
	calendarDisplay( year, month, day, hour, minute );

	_calendarDayChosen = day;
}

function calendarDisplay( year, month, day=null, hour=null, minute=null ) {
	let lastDayOfMonthDate = new Date(parseInt(year), parseInt(month)+1, 0);
	let numDaysInMonth = lastDayOfMonthDate.getDate();

	let firstDayInMonthDate = new Date( year, month, 1 );
	let firstWeekDayOfMonth = firstDayInMonthDate.getDay();
	firstWeekDayOfMonth = (firstWeekDayOfMonth==0) ? 6 : firstWeekDayOfMonth-1;
	let lastWeekDayOfMonth = lastDayOfMonthDate.getDay();
	lastWeekDayOfMonth = (lastWeekDayOfMonth==0) ? 6 : lastWeekDayOfMonth-1;

	for( let w = 0 ; w < 6 ; w++ ) {
		for( let d = 0 ; d < 7 ; d++ ) {
			let dayElem = document.getElementById( `calendar-w${w}-d${d}` );
			let dayNum = w*7 + d - firstWeekDayOfMonth;   

			if( dayNum + 1 != day ) {
				dayElem.style.backgroundColor = '#ffffff';
			} else {
				dayElem.style.backgroundColor = '#dfdfdf';					
			}

			if( dayNum < 0 ) {
				dayElem.childNodes[0].textContent = '';
				continue;
			}
			if( dayNum >= numDaysInMonth ) {
				dayElem.childNodes[0].textContent = '';
				continue;
			}
			dayElem.childNodes[0].textContent = dayNum+1;
		}
	}

	if( !_calendarFormat.dateOnly ) {			
		if( hour !== null ) {
			document.getElementById('calendar-hour').value = hour;
		}
		if( minute !== null ) {	
			document.getElementById('calendar-minute').value = minute;		
		}
	}
}
