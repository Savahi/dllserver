
var _tableSplitterCaptured = -1;
var _tableSplitterCapturedAtX = -1;
var _tableSplitterCurrentPosition = null;

var _tableHeaderColumnSwapper = null;
var _tableHeaderColumnSwapperCapturedAtX = -1;
var _tableHeaderColumnSwapperOriginalX = -1;


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

function onWindowResize(e) { 
	initLayoutCoords(); 
	displayData(); 
}


function onWindowContextMenu(e) { 
	e.preventDefault(); 
	return(false); 
}


function onWindowMouseUp(e) { 
	e.stopPropagation();
	//e.preventDefault();
 	
	if( _tableSplitterCaptured >= 0 ) {
		let x = getClientX( e, _tableSplitterCurrentPosition );
		if( x !== null ) {
			let newWidth = _data.table[_tableSplitterCaptured].width + x - _tableSplitterCapturedAtX;
			setNewColumnWidth( _tableSplitterCaptured, newWidth );
			_tableSplitterCaptured = -1;
			_tableSplitterCurrentPosition = null;
			calcAndSetTableDimensions();
			drawTableHeader();
			drawTableContent();			
		}		
	}
	if( _tableHeaderColumnSwapperCapturedAtX >= 0 ) { // Table column title has been moved...
		_tableHeaderColumnSwapperCapturedAtX = -1;
		let from = Number(_tableHeaderColumnSwapper.dataset.columnNumber);
		_tableHeaderColumnSwapper.remove();
		_tableHeaderColumnSwapper = null;
		_tableHeaderSVGBkgr.style.cursor = 'default';
		let x = getClientX(e,-1);
		if( x !== null ) {
			x += _containerDiv.scrollLeft;
			for( let col = 1 ; col < _data.table.length ; col++ ) { // To find the column to swap with...
				let el = document.getElementById( 'tableHeaderColumnNameSVG' + col );
				let columnX = parseInt( el.getAttributeNS( null, 'x' ) ); 
				let width = parseInt( el.getAttributeNS( null, 'width' ) ); 
				//console.log( `x=${x}, columnX=${columnX}, width=${width}` );
				if( x > columnX && x < (columnX + width) ) {
					if( from != col ) {
						//console.log(`from=${from}, col=${col}`)
						moveElementInsideArrayOfObjects(_data.table, from, col );
						drawTableHeader(true);
						drawTableContent(true);					
						for( let cookie = 0 ; cookie < _data.table.length ; cookie++ ) { // Updating cookies according to new column sort order.
							setCookie( _data.table[cookie].ref + "Position", cookie );
						}
					}
					break;
				}
			}
		}
	}
}


function onWindowMouseMove(e) { 
	e.stopPropagation();
	//e.preventDefault();

	if( _tableSplitterCaptured >= 0 ) { // Table splitter captured - a table column width is being changing...
		let el = document.getElementById('tableSplitter'+_tableSplitterCaptured);		
		let x = getClientX( e, null );
		if( x !== null ) {		
			_tableSplitterCurrentPosition = x + _containerDiv.scrollLeft; // + _tableViewBoxLeft;
			if( _tableSplitterCaptured > 0 ) { // To ensure not sliding too far to the left...
				let leftEl = document.getElementById( 'tableSplitter'+(_tableSplitterCaptured-1) );
				let leftX = parseInt( leftEl.getAttributeNS(null,'x') );
				if( _tableSplitterCurrentPosition < leftX + _settings.minTableColumnWidth ) {
					_tableSplitterCurrentPosition = leftX + _settings.minTableColumnWidth;
				} 
			}
			el.setAttributeNS(null,'x',_tableSplitterCurrentPosition);
		}	
		return;
	}
	if( _tableHeaderColumnSwapper != null ) {
		let x = getClientX( e, null );
		if( x !== null ) {
			let newX = _tableHeaderColumnSwapperOriginalX + x - _tableHeaderColumnSwapperCapturedAtX;
			_tableHeaderColumnSwapper.setAttributeNS(null,'x', newX );
		}
		return;
	}
}


function onTableHeaderMouseDown(e) {
	if( !_touchDevice ) {
		let x = getClientX(e, null);
		if( x !== null ) {
			_tableHeaderColumnSwapper = this.cloneNode(true);
			_tableHeaderSVG.appendChild(_tableHeaderColumnSwapper);
			_tableHeaderColumnSwapperCapturedAtX = x;
			_tableHeaderColumnSwapperOriginalX = parseInt( _tableHeaderColumnSwapper.getAttributeNS(null,'x') );	
			_tableHeaderColumnSwapper.setAttributeNS(null,'opacity',0.5);
			_tableHeaderColumnSwapper.style.cursor = 'col-resize';
			_tableHeaderSVGBkgr.style.cursor = 'col-resize';
		}
	}
}



function onTableHeaderTouchStart(e) {
	e.stopPropagation();
	//e.preventDefault();

	let columnNumber = Number(this.dataset.columnNumber);
	if( _touchDevice ) {
		let el = this; document.getElementById('tableSplitter'+columnNumber);
		let cXY = getTouchEventXY(e);
		//console.log( `cXY=${cXY}` );
		if( cXY[4] !== null ) {
			let columnLeft = parseInt( this.getAttributeNS(null, 'x') );
			let columnWidth = parseInt( this.getAttributeNS(null, 'width') );
			//alert( `cXY[0]=${cXY[0]}, cXY[2]=${cXY[2]}, cXY[4]=${cXY[4]}, columnLeft=${columnLeft}, columnWidth=${columnWidth}` );
			if( cXY[4] < columnLeft + columnWidth/2 ) {
				setNewColumnWidth( columnNumber, _data.table[columnNumber].width - 5 );			
			} else {
				setNewColumnWidth( columnNumber, _data.table[columnNumber].width + 5 );							
			}
		}
	}	
}




function setNewColumnWidth( columnNumber, newColumnWidth ) {
	if( newColumnWidth < _settings.minTableColumnWidth ) {
		newColumnWidth = _settings.minTableColumnWidth;
	}
	_data.table[columnNumber].width = newColumnWidth;
	setCookie( _data.table[columnNumber].ref + "Width", _data.table[columnNumber].width );
	drawTableHeader();
	drawTableContent();
}


function onTableColumnSplitterMouseDown(e) {
	e.stopPropagation();
	//e.preventDefault();

	let columnNumber = Number(this.dataset.columnNumber);
	if( !_touchDevice ) {
		let x = getClientX(e, null);
		if( x !== null ) {
			_tableSplitterCaptured = columnNumber; 
			_tableSplitterCapturedAtX = x;
		} 
	} else if( false ) {
		let el = document.getElementById('tableSplitter'+columnNumber);
		let cXY = getTouchEventXY(e);
		//console.log(`cXY=${cXY}`);
		if( cXY[5] !== null ) {
			//console.log(`cXY=${cXY}`);
			let expand = (cXY[1] < _containerDivY + _tableHeaderSVGHeight/2);
			let newWidth = (expand) ? _data.table[columnNumber].width + 5 : _data.table[columnNumber].width - 5;
			setNewColumnWidth( columnNumber, newWidth );			
		}
	}	
}



function onZoomHorizontallyIcon(id, e, inputId) {
	let c = getCoordinatesOfClickOnImage( id, e );
	let value = parseInt(inputId.value);
	if( c[2] == 0 && !isNaN(value) ) { // Upper half
		value = parseInt((value - 25.0) / 25.0 + 0.5) * 25;
	} else {
		value = parseInt((value + 25.0) / 25.0 + 0.5) * 25;
	}
	inputId.value = value;
	onZoomHorizontallyBlur(inputId);
}


function onZoomVerticallyBlur(id) {
	let value = parseInt(id.value);
	if( isNaN(value) ) {
		value = 100;
	} else {
		if( value < 100 ) {
			value = 100;
		}
	}
	id.value = value;
	zoomYR( (parseInt(value) - parseInt(_notHiddenOperationsLength * 100.0 / _visibleHeight + 0.5)) / 100.0 ); 
}


function onZoomVerticallyIcon(id, sign, inputId) {
	//let c = getCoordinatesOfClickOnImage( id, e );
	let value = parseInt(inputId.value);
	if( !isNaN(value) ) {
		if( sign > 0 ) { // Upper half
			value = parseInt((value + 25.0) / 25.0 + 0.5) * 25;
		} else {
			value = parseInt((value - 25.0) / 25.0 + 0.5) * 25;
		}
	} else {
		value = 100;
	}
	inputId.value = value;
	onZoomVerticallyBlur(inputId);
}



function getClientX(e, defaultValue=null ) {
	if( 'clientX' in e  ) {
		return e.clientX;
	}
	if( 'touches' in e ) {
		if( e.touches.length > 0 ) {
			return e.touches[0].clientX;
		}
	}
	return defaultValue;
}

function getClientY(e, defaultValue=null ) {
	if( 'clientY' in e  ) {
		return e.clientY;
	}
	if( 'touches' in e ) {
		if( e.touches.length > 0 ) {
			return e.touches[0].clientY;
		}
	}
	return defaultValue;
}

function getPageX(e, defaultValue=null ) {
	if( 'pageX' in e  ) {
		return e.pageX;
	}
	if( 'touches' in e ) {
		if( e.touches.length > 0 ) {
			return e.touches[0].pageX;
		}
	}
	return defaultValue;
}


function getTouchEventXY(e) {
	if( 'touches' in e ) {
		if( e.touches.length > 0 ) {
			t = e.touches[0];
			return [ t.clientX, t.clientY, t.pageX, t.pageY, t.offsetX, t.offsetY ];
		}
	}
	if( e ) {
		return [ e.clientX, e.clientY, e.pageX, e.pageY, e.offsetX, e.offsetY ];
	}
	return [ null, null, null, null, null, null ];
}
