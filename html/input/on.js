
function onWindowLoad() {
	if( 'ontouchstart' in document.documentElement ) { // To confirm it is a touch device or not...
		_touchDevice = true;
	}

	let patternMDY = new RegExp( '([mM]+)([dD]+)([yY]+)' ); // Determining date format: DMY or MDY
	if( patternMDY.test(_dateFormat) ) {               
		_dateDMY=false;
	} 

	if( _dateDelim === 'undefined' ) {
		_dateDelim = '.';
	} else if( typeof(_dateDelim) !== 'string' ) {
		_dateDelim = '.';
	} else if( _dateDelim.length == 0 ) {
		_dateDelim = '.';
	}
	if( _timeDelim === 'undefined' ) {
		_timeDelim = ':';
	} else if( typeof(_timeDelim) !== 'string' ) {
		_timeDelim = ':';
	} else if( _timeDelim.length == 0 ) {
		_timeDelim = ':';
	}

	initLayout();
	loadData();
}


function onWindowContextMenu(e) { 
	e.preventDefault(); 
	return(false); 
}
