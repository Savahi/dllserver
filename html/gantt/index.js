// index.js
var NS = "http://www.w3.org/2000/svg";

var _redrawAllMode = false;
var _touchDevice = false;
var _dateDMY = true;
var _ganttMTime = -1;
var _displayLinksOn = null;
var _displayLinksDisabled = null;
var _titlesPositioning = 'r';
var _dataSynchronized = 1;
var _synchronizationRate = 30*1000; 	// How often the connection with the server is verified
var _maxExpandableLevel = 1; // The deepest level of data
var _userName=null;
var _data;

var _lang="ru";
var _dateDelim="";
var _timeDelim="";
var _dateFormat="";
var _secondsInPixel=13708;
var _expandToLevelAtStart=3;

var _settings = {
	ganttOperation0Color:'#2f8f2f', ganttOperation0Opacity:1.0, ganttOperation100Color:'#7f7f7f', ganttOperation100Opacity:1.0,
	ganttPhaseColor:'#0f7f07f', ganttPhaseOpacity:1.0, 
	ganttCriticalColor:'#bf2f2f', ganttCompareColor:'#cfcfdf', ganttCompareOpacity:0.75, ganttFontColor:'#4f4f4f', 
	ganttOperationStrokeWidth:0, ganttMinFontSize:6, ganttMaxFontSize:14,
	ganttLinkStrokeColor:'#000000',	ganttLinkStrokeWidth:0.5, ganttLinkStrokeDashArray:null, 
	ganttLinkOpacity:0.50, ganttLinkArrowOpacity:1.0, ganttLinkArrowWidth:8, ganttLinkArrowHeight:8,
	timeScaleFontColor:'#4f4f4f', timeScaleFillColor:'#cfcfdf', timeScaleStrokeColor:'#afafaf', ganttBkgrColor:'#ffffff',
	timeScaleMaxFontSize:12, minRectWidthOnTimeScale:14, minDayWidthOnTimeScale:12, 
	tableHeaderFontColor:'#4f4f4f',	tableHeaderFillColor:'#cfcfdf', tableHeaderColumnSplitterColor:'#bfbfcf',
	tableHeaderBorderColor:'#cfcfdf', tableHeaderActiveBorderColor:'#8f8f9f', 
	tableContentFontColor:'#4f4f4f', tableContentFillColor:'#efefff', tableContentStrokeColor:'#4f4f4f', 
	tableHeaderColumnHMargin:2, tableColumnHMargin:2, tableColumnTextMargin:2, 
	tableMaxFontSize:14, tableMinFontSize:2, minTableColumnWidth:4, hierarchyIndent:4,	
	scrollBkgrColor:'#cfcfcf', scrollRectColor:'#afafaf', scrollSliderColor:'#8f8f8f', scrollSliderActiveColor:'#000000',
	gridColor:"#7f7f7f", gridStrokeWidth:0.25, gridStrokeDashArray:'1,2', 
	gridCurrentTimeColor:"#bf2f2f", gridCurrentTimeStrokeWidth:1.0, 
	editedColor:"#bf2f2f", ganttChartLeftMargin:8, ganttChartRightMargin:8, 
	ganttRectTopMargin:0.6, ganttRectBottomMargin:0.125, ganttRectTopMarginTitleFree:0.1, ganttRectBottomMarginTitleFree:0.3,
	ganttCompareTopMargin:0.8, ganttCompareBottomMargin:0.0, ganttCompareTopMarginTitleFree:0.6, ganttCompareBottomMarginTitleFree:0.1,
	ganttRectBracketRelHeight:0.25,	ganttRectBracketThick:5,
	scrollThick:10, verticalScrollThick:10, scrollSliderSize:10, timeScaleScrollStep:0.1, tableScrollStep:0.1, verticalSplitterInitialPosition:0.25,
	verticalSplitterWidth:8, verticalSplitterStrokeColor:'#4f4f4f', verticalSplitterBkgrColor:'#dfdfdf',
	zoomFactor:0.25, minXZoomFactor:1.0, minSecondsZoomed:43200, ganttVisibleWidthExtra:0.5,  containerHPadding:2, 
	webExportLineNumberColumnName:'f_WebExportLineNumber',
	ganttSVGCursor:'zoom-in', ganttSVGCapturedCursor:'pointer', timeSVGCursor:'zoom-in',
	readableNumberOfOperations:28, minNumberOfOperationsOnScreen:6, maxNumberOfOperationsOnScreen:50
}

var _requests = { data:"/.gantt_data", logout:"/.logout", save:"/.save_gantt", check_synchro:"/.check_gantt_synchro" };

var _zoomHorizontallyInput = null;
var _zoomHorizontallyIcon = null;
var _zoomHorizontallyMinusIcon = null;
var _zoomHorizontallyPlusIcon = null;
var _zoomVerticallyInput = null; 
var _zoomVerticallyIcon = null;
var _zoomVerticallyMinusIcon = null;
var _zoomVerticallyPlusIcon = null;
var _displayLinksDiv = null; 
var _displayLinksIcon = null; 
var _titlesPositioningDiv = null;
var _titlesPositioningIcon = null;
var _expandInput = null;
var _expandAllIcon = null;
var _expandIcon = null;
var _expandPlusIcon = null;
var _expandMinusIcon = null;

var _containerDiv = null;
var _containerSVG = null;
var _timeSVG = null;
var _ganttSVG = null;
var _tableContentSVG = null;
var _tableContentSVGContainer = null;
var _tableHeaderSVG = null;
var _verticalSplitterSVG = null;
var _tableScrollSVG = null;
var _ganttHScrollSVG = null;
var _verticalScrollSVG = null;

var _containerDivX, _containerDivY, _containerDivHeight, _containerDivWidth;

var _visibleTop;      // Gantt & Table top visible operation 
var _visibleHeight;   // Gantt & Table visible operations number
var _notHiddenOperationsLength=0;

var _ganttSVGWidth;
var _ganttSVGHeight;
var _ganttVisibleLeft;
var _ganttVisibleWidth;
var _ganttSVGBkgr = null;
var _ganttViewBoxLeft = 0;
var _ganttViewBoxTop = 0;

var _timeSVGWidth;
var _timeSVGHeight;
var _timeSVGBkgr=null;

var _tableContentSVGWidth;
var _tableContentSVGHeight;
var _tableContentSVGBkgr=null;

var _tableHeaderSVGWidth;
var _tableHeaderSVGHeight;
var _tableHeaderSVGBkgr=null;
var _tableHeaderOverallWidth=0;

var _tableViewBoxLeft = 0; // 
var _tableViewBoxTop = 0;

var _ganttCaptured = false;
var _ganttCapturedAtX;
var _ganttLastFoundAtX;
var _ganttCapturedAtY;
var _ganttLastFoundAtY;
var _ganttCapturedLeft;
var _ganttCapturedTop;

var _verticalSplitterSVGWidth;
var _verticalSplitterSVGHeight;
var _verticalSplitterSVGBkgr=null;
var _verticalSplitterCaptured=false;
var _verticalSplitterCapturedAtX;
var _verticalSplitterPosition = null;

var _tableSplitterCaptured = -1;
var _tableSplitterCapturedAtX = -1;

var _timeScaleToGrid = [];

var _tableScrollSVGWidth, _tableScrollSVGHeight;
var _tableScrollCaptured = false;
var _tableScrollCapturedAtX = -1;
var _tableScrollXAtCapture = -1;
var _tableScrollSVGSlider=null;
var _tableScrollSVGBkgr=null;

var _ganttHScrollSVGWidth, _ganttHScrollSVGHeight;
var _ganttHScrollCaptured = false;
var _ganttHScrollCapturedAtX = -1;
var _ganttHScrollXAtCapture = -1;
var _ganttHScrollSVGSlider=null;
var _ganttHScrollSVGBkgr=null;

var _verticalScrollSVGWidth, _verticalScrollSVGHeight;
var _verticalScrollCaptured = false;
var _verticalScrollCapturedAtY = -1;
var _verticalScrollYAtCapture = -1;
var _verticalScrollSVGSlider=null;
var _verticalScrollSVGBkgr=null;

var _verticalScrollSVGWidth, _verticalScrollSVGHeight;

var _tableHeaderColumnSwapper = null;
var _tableHeaderColumnSwapperCapturedAtX = -1;
var _tableHeaderColumnSwapperOriginalX = -1;

if( 'ontouchstart' in document.documentElement ) { // To know if it is a touch device or not...
	_touchDevice = true;
	_settings.verticalSplitterWidth = 20; // A "TRY" CODE!!!!
	_settings.scrollThick = 20;
	_settings.verticalScrollThick = 30;
	document.getElementById('menuPrint').setAttribute('style','display:none');
}

window.addEventListener( "load", onWindowLoad );
window.addEventListener( "resize", onWindowResize );

if( !_touchDevice ) {
	window.addEventListener( "contextmenu", onWindowContextMenu );
}

/*
window.addEventListener( "wheel", function(event) {
	if( event.ctrlKey ) {
		event.preventDefault(); //prevent zoom
	}
});
*/

if( !_touchDevice ) {
	window.addEventListener( 'mouseup', onWindowMouseUp, true );
} else {
	; // window.addEventListener( 'touchcancel', onWindowMouseUp, true );
	; // window.addEventListener( 'touchend', onWindowMouseUp, true );
}

if( !_touchDevice ) {
	window.addEventListener( 'mousemove', onWindowMouseMove );
} else {
	window.addEventListener( 'touchmove', function(e) { e.preventDefault(); } );
}

function loadData() {
	if( document.location.host ) {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
		    if (this.readyState == 4 ) {
		    	if( this.status == 200) {
			    	let errorParsingData = false;
			    	try{
				        _data = JSON.parse(this.responseText);
			    	} catch(e) {
			    		alert('Error: ' + e.name + ":" + e.message + "\n" + e.stack + "\n" + e.cause);
			    		errorParsingData = true;
			    	}
			    	if( errorParsingData ) { // To ensure data are parsed ok... // alert(this.responseText);
						displayMessageBox( _texts[_lang].errorParsingData ); 
						return;
			    	}
			    	let noOperations=false; 
			    	if( !('operations' in _data) ) { // To ensure there are operations in data...
			    		noOperations = true;
			    	} else if( _data.operations.length == 0 ) {
			    		noOperations = true;
			    	} 
			    	if( noOperations ) {
						displayMessageBox( _texts[_lang].errorParsingData ); 
						return;
			    	}
			    	if( _data.operations.length > 400 ) {
			    		_redrawAllMode = true;
			    	}
					// Adding the first column with expend tool
					_data.table.unshift( { "name":"[]", "ref":"expandColumn", "width":2, "visible":true, "type":null,"format":null } );

			    	let noEditables=false; // To check if some data are editable or not...
			    	if( !('editables' in _data) ) {
			    		noEditables = true;
			    	} else if( _data.editables.length == 0 ) {
			    		noEditables = true;
			    	} 
			    	if( noEditables ) {
			    		_data.noEditables = true;
					    hideMessageBox();		    
						if( initData() == 0 ) {
							displayData();		
						}
						return; 
			    	}
		    		_data.noEditables = false;			        	
		        	createEditBoxInputs();

					if( 'parameters' in _data ) {
						if( 'lang' in _data.parameters )
							_lang = _data.parameters.lang;
						if( 'dateDelim' in _data.parameters )
							_dateDelim = _data.parameters.dateDelim;
						if( 'timeDelim' in _data.parameters )
							_timeDelim = _data.parameters.timeDelim;
						if( 'dateFormat' in _data.parameters )
							_dateFormat = _data.parameters.dateFormat;
						if( 'secondsInPixel' in _data.parameters )
							_secondsInPixel = _data.parameters.secondsInPixel;
						if( 'expandToLevelAtStart' in _data.parameters )
							_expandToLevelAtStart = _data.parameters.expandToLevelAtStart;
						if( 'userName' in _data.parameters ) {
							_userName = _data.parameters.userName;
						} else {
							_userName = getCookie('user');
						}
					}
				    hideMessageBox();		    
					if( initData() == 0 ) {
						displayData();
					}
		        	setTimeout( ifSynchronizedCheck, _synchronizationRate );
				} else {
					displayMessageBox( _texts[_lang].errorLoadingData ); 
				}
		    }
		};
		let requestUrl = _requests.data + ((window.location.search.length > 0) ? (window.location.search) : ''); 
		xmlhttp.open("GET", requestUrl, true);
		xmlhttp.setRequestHeader("Cache-Control", "no-cache");
		xmlhttp.send();
		displayMessageBox( _texts[_lang].waitDataText ); 
	} 
}

function displayData() {	
	displayHeaderAndFooterInfo();	
	drawAll();
}

function drawAll() {
	drawTableHeader(true);
	drawTableContent(true);
	drawGantt(true);
	drawTimeScale();
	drawTableScroll( true );
	drawGanttHScroll( true );
	drawVerticalScroll( true );			
	drawVerticalSplitter( true );	
}

function initData() {
	let curTimeParsed = parseDate( _data.proj.CurTime );
	if( curTimeParsed != null ) {
		_data.proj.curTimeInSeconds = curTimeParsed.timeInSeconds;
	} else {
		_data.proj.curTimeInSeconds = parseInt(Date.now()/1000);		
	}

	if( _data.operations.length == 0 ) {
		displayMessageBox( _texts[_lang].errorParsingData );						
		return(-1);				
	}
	if( !('Code' in _data.operations[0]) || !('Level' in _data.operations[0]) ) { 	// 'Code' and 'Level' is a must!!!!
		displayMessageBox( _texts[_lang].errorParsingData );						// Exiting otherwise...
		return(-1);		
	}

	// Retrieving dates of operations, calculating min. and max. dates.
	_data.startMinInSeconds = -1;
	_data.finMaxInSeconds = -1;
	_data.startFinSeconds = -1

	var parsed;
	for( let i = 0 ; i < _data.operations.length ; i++ ) {
		let d = _data.operations[i];
		parsed = parseDate( d.AsapStart );
		if( parsed !== null ) {
			_data.startMinInSeconds = reassignBoundaryValue( _data.startMinInSeconds, parsed.timeInSeconds, false );
			d.AsapStartInSeconds = parsed.timeInSeconds;
		} else {
			d.AsapStartInSeconds = -1;
		}
		parsed = parseDate( d.AsapFin );
		if( parsed !== null ) {
			_data.finMaxInSeconds = reassignBoundaryValue( _data.finMaxInSeconds, parsed.timeInSeconds, true );
			d.AsapFinInSeconds = parsed.timeInSeconds;
		} else {
			d.AsapFinInSeconds = -1;
		}
		parsed = parseDate( d.FactStart );
		if( parsed !== null ) {
			_data.startMinInSeconds = reassignBoundaryValue( _data.startMinInSeconds, parsed.timeInSeconds, false );
			d.FactStartInSeconds = parsed.timeInSeconds;
		} else {
			d.FactStartInSeconds = -1;
		}
		parsed = parseDate( d.FactFin );
		if( parsed !== null ) {
			_data.finMaxInSeconds = reassignBoundaryValue( _data.finMaxInSeconds, parsed.timeInSeconds, true );
			d.FactFinInSeconds = parsed.timeInSeconds;
		} else {
			d.FactFinInSeconds = -1;
		}
		parsed = parseDate( d.Start_COMP );
		if( parsed !== null ) {
			_data.startMinInSeconds = reassignBoundaryValue( _data.startMinInSeconds, parsed.timeInSeconds, false );			
			d.Start_COMPInSeconds = parsed.timeInSeconds;			
		} else {
			d.Start_COMPInSeconds = -1;
		}
		parsed = parseDate( d.Fin_COMP );
		if( parsed !== null ) {
			_data.finMaxInSeconds = reassignBoundaryValue( _data.finMaxInSeconds, parsed.timeInSeconds, true );			
			d.Fin_COMPInSeconds = parsed.timeInSeconds;			
		} else {
			d.Fin_COMPInSeconds = -1;
		}
		parsed = parseDate( d.alapStart );
		if( parsed !== null ) {
			_data.startMinInSeconds = reassignBoundaryValue( _data.startMinInSeconds, parsed.timeInSeconds, false );			
			d.alapStartInSeconds = parsed.timeInSeconds;			
		} else {
			d.alapStartInSeconds = -1;
		}
		parsed = parseDate( d.f_LastFin );
		if( parsed !== null ) {
			d.lastFinInSeconds = parsed.timeInSeconds;			
		} else {
			d.lastFinInSeconds = d.AsapStartInSeconds; // To prevent error if for some reason unfinished operation has no valid f_LastFin. 
		}

		// Start and finish
		if( d.FactFin ) {
			d.status = 100; // finished
			d.displayStartInSeconds = d.FactStartInSeconds; 
			d.displayFinInSeconds = d.FactFinInSeconds;
			d.displayRestartInSeconds = null; 
		} else {
			if( !d.FactStart ) { // Has not been started yet
				d.status = 0; // not started 
				d.displayStartInSeconds = d.AsapStartInSeconds; 
				d.displayFinInSeconds = d.AsapFinInSeconds;
				d.displayRestartInSeconds = null;
			} else { // started but not finished
				let divisor = (d.AsapFinInSeconds - d.AsapStartInSeconds) + (d.lastFinInSeconds - d.FactStartInSeconds); 
				if( divisor > 0 ) {
					d.status = parseInt( (d.lastFinInSeconds - d.FactStartInSeconds) * 100.0 / divisor - 1.0); 
				} else {
					d.status = 50;
				}
				d.displayStartInSeconds = d.FactStartInSeconds; 
				d.displayFinInSeconds = d.AsapFinInSeconds;
				d.displayRestartInSeconds = d.AsapStartInSeconds;
			}
		}
		d.color = decColorToString( d.f_ColorCom, _settings.ganttOperation0Color );
		d.colorBack = decColorToString( d.f_ColorBack, "#ffffff" );
		d.colorFont = decColorToString( d.f_FontColor, _settings.tableContentStrokeColor );
		if( typeof( d.Level ) === 'string' ) {
			if( digitsOnly(d.Level) ) {
				d.Level = parseInt(d.Level);
			}
		}
	}
	if( _data.startMinInSeconds == -1 || _data.finMaxInSeconds == -1 ) {	// If time limits are not defined... 
		displayMessageBox( _texts[_lang].errorParsingData );				// ...exiting...
		return(-1);
	}

	_data.startFinSeconds = _data.finMaxInSeconds - _data.startMinInSeconds;
	_data.visibleMin = _data.startMinInSeconds; // - (_data.finMaxInSeconds-_data.startMinInSeconds)/20.0;
	_data.visibleMax = _data.finMaxInSeconds; // + (_data.finMaxInSeconds-_data.startMinInSeconds)/20.0;
	_data.visibleMaxWidth = _data.visibleMax - _data.visibleMin;

	// Initializing the parent-children structure and the link structure
	for( let i = 0 ; i < _data.operations.length ; i++ ) {
		_data.operations[i].id = 'ganttRect' + i; // Id
		initParents(i);
		_data.operations[i]._isPhase = (typeof(_data.operations[i].Level) === 'number') ? true : false;
		_data.operations[i].hasLinks = false;
	}

	// Marking 'expandables'
	for( let i = 0 ; i < _data.operations.length ; i++ ) {
		let hasChild = false;
		for( let j = i+1 ; j < _data.operations.length ; j++ ) {
			for( let k = 0 ; k < _data.operations[j].parents.length ; k++ ) {
				if( _data.operations[j].parents[k] == i ) { // If i is a parent of j
					hasChild = true;
					break;
				}
			}
			if( hasChild ) {
				break;
			}
		}
		if( hasChild ) {
			_data.operations[i].expanded = true;
			_data.operations[i].expandable = true;
		} else {
			_data.operations[i].expanded = true;			
			_data.operations[i].expandable = false;
		}
		_data.operations[i].visible = true;
	}

	// Searching for the deepest level... 
	_maxExpandableLevel = 1;
	for( let i = 0 ; i < _data.operations.length ; i++ ) {
		if( _data.operations[i].parents.length >= _maxExpandableLevel ) {
			_maxExpandableLevel =  _data.operations[i].parents.length + 1;
		}
	}
	_expandInput.value = _maxExpandableLevel; 	// To init the input, that allows futher changing expand level

	if( typeof(_expandToLevelAtStart) === 'undefined' ) 	// If an expand level is not set at startup
		_expandToLevelAtStart = 3;
	if( _expandToLevelAtStart === null ) 	// If an expand level is not set at startup
		_expandToLevelAtStart = 3;
	if( _expandToLevelAtStart > _maxExpandableLevel ) // If an invalid _expandToLevelAtStart was specified
		_expandToLevelAtStart = _maxExpandableLevel;
	_expandInput.value = _expandToLevelAtStart;  			// Initializing the input
	expandToLevel( _expandToLevelAtStart, false ); 	// Expanding...

	// Searching for the linked operations, assigning links with operation indexes and marking the operations to know they are linked...
	for( let l = 0 ; l < _data.links.length ; l++ ) {
		let predOp = -1;
		let succOp = -1;
		for( let op = 0 ; op < _data.operations.length ; op++ ) {
			if( predOp == -1 ) { 
				if( _data.operations[op].Code == _data.links[l].PredCode ) { predOp = op; }
			}
			if( succOp == -1 ) {
				if( _data.operations[op].Code == _data.links[l].SuccCode ) { succOp = op; }
			}
			if( predOp != -1 && succOp != -1 ) {
				break;
			}
		}
		if( predOp != -1 && succOp != -1 ) {
			_data.links[l].predOp = predOp;
			_data.links[l].succOp = succOp;
			_data.operations[predOp].hasLinks = true;
			_data.operations[succOp].hasLinks = true;			
		} else {
			_data.links[l].predOp = null;
			_data.links[l].succOp = null;
		}

	}

	// Handling table columns widths
	for( let col = 0 ; col < _data.table.length ; col++ ) { // Recalculating widths in symbols into widths in points 
		let add = _settings.tableColumnHMargin*2 + _settings.tableColumnTextMargin*2;
		_data.table[col].width = _data.table[col].width * _settings.tableMaxFontSize*0.5 + add;
	}
	_data.initialTable = []; // Saving table settings loaded from a local version of Spider Project
	copyArrayOfObjects( _data.table, _data.initialTable );
	// Reading cookies to init interface elements.
	for( let col = 0 ; col < _data.table.length ; col++ ) {
		let widthValue = getCookie( _data.table[col].ref + "Width", 'int' );
		if( widthValue ) {
			_data.table[col].width = widthValue;
		}
	}

	// Reading and assigning the positions of columns.
	let failed = false;
	for( let col = 0 ; col < _data.table.length ; col++ ) {
		let pos = getCookie( _data.table[col].ref + "Position", 'int' );
		if( pos == null ) {
			failed = true;
			break;			
		}
		if( pos >= _data.table.length ) {
			failed = true;
			break;
		}
	}
	if( !failed ) { // If all the positions for every column have been found in cookies...
		let moveTo = _data.table.length-1;
		for( let col = 0 ; col < _data.table.length ; col++ ) {
			for( let cookie = 0 ; cookie < _data.table.length ; cookie++ ) { // Searching for the column to be moved to 'moveTo' position...
				let pos = getCookie( _data.table[cookie].ref+"Position", 'int' );
				if( pos == moveTo ) {
					moveElementInsideArrayOfObjects( _data.table, cookie, moveTo );
					moveTo -= 1;
					break;
				}
			}
		}
	} else { // Deleting all the cookies that stores positions of columns...
		for( let cookie = 0 ; cookie < _data.table.length ; cookie++ ) {
			let cname = _data.table[cookie].ref+"Position";
			if( getCookie(cname) != null ) {
				deleteCookie( cname );
			}
		}
	}

	calcNotHiddenOperationsLength();

	// Initializing zoom
	let newZoom = calculateHorizontalZoomByVerticalZoom( 0, _settings.readableNumberOfOperations );
	_visibleTop = newZoom[0];
	_visibleHeight = newZoom[1];
	_ganttVisibleLeft = newZoom[2];
	_ganttVisibleWidth = newZoom[3];

	// Reading and validating top and height saved in cookies
	let gvt = getCookie('ganttVisibleTop', 'float');
	let gvh = getCookie('ganttVisibleHeight', 'float');
	//if( gvh ) { console.log('GVH FOUND!!!!' + gvh);}
	if( gvt || gvh ) {
		if( !gvt ) { gvt = _visibleTop; }
		if( !gvh ) { gvh = _visibleHeight; }
		let validated = validateTopAndHeight( gvt, gvh );
		_visibleTop = validated[0];
		_visibleHeight = validated[1];
	}
	displayYZoomFactor();

	//console.log(_visibleHeight);

	// Initializing horizontal zoom
	let gvw = getCookie('ganttVisibleWidth', 'float'); 	// Reading gantt width from cookies
	if( !gvw ) {
		gvw = _secondsInPixel*_ganttSVGWidth; 		// Calculating gantt width out of scale
	}
	if( gvw > 60*60 && !(gvw >_data.visibleMaxWidth) ) {
		_ganttVisibleWidth = gvw;
	}	

	let gvl = getCookie('ganttVisibleLeft', 'float');
	if( gvl ) {
		_ganttVisibleLeft = validateGanttLeft(gvl);
	}
	displayXZoomFactor();

	calcTableHeaderOverallWidth();

	return(0);
}


function initParents( iOperation ) {
	_data.operations[iOperation].parents = []; // Initializing "parents"
	for( let i = iOperation-1 ; i >= 0 ; i-- ) {
		let l = _data.operations[iOperation].parents.length;
		let currentLevel;
		if( l == 0 ) {
			currentLevel = _data.operations[iOperation].Level;
		} else {
			let lastPushedIndex = _data.operations[iOperation].parents[l-1];
			currentLevel = _data.operations[lastPushedIndex].Level;
		}
		if( currentLevel === null || currentLevel === 'P' ) { // Current level is an operation
			if( typeof(_data.operations[i].Level) === 'number' ) {
				_data.operations[iOperation].parents.push(i);
			}
		} else if( typeof(currentLevel) === 'number' ) { // Current level is a phase
			if( typeof(_data.operations[i].Level) === 'number' ) {
				if( _data.operations[i].Level < currentLevel ) { // _data.operations[iOperation].Level ) {
					_data.operations[iOperation].parents.push(i);
				}
			}
		} else if( typeof(currentLevel) === 'string' ) { // Current level is a team or resourse or a project
			if( _data.operations[i].Level === null ) { // The upper level element is an operation
				_data.operations[iOperation].parents.push(i);
			} else if( currentLevel == 'A' ) {
				if( _data.operations[i].Level === 'T' ) { // The upper level element is a team
					_data.operations[iOperation].parents.push(i);
				}
			}
		}
	}	
}


function initLayout() {
	if( _touchDevice ) {	
		document.documentElement.style.setProperty('--toolbox-table-height', '40px');
	}
	_zoomHorizontallyInput = document.getElementById('toolboxZoomHorizontallyInput');
	_zoomHorizontallyIcon = document.getElementById('toolboxZoomHorizontallyIcon');
	_zoomHorizontallyMinusIcon = document.getElementById('toolboxZoomHorizontallyMinusIcon');
	_zoomHorizontallyPlusIcon = document.getElementById('toolboxZoomHorizontallyPlusIcon');
	_zoomVerticallyInput = document.getElementById('toolboxZoomVerticallyInput'); 
	_zoomVerticallyIcon = document.getElementById('toolboxZoomVerticallyIcon'); 
	_zoomVerticallyPlusIcon = document.getElementById('toolboxZoomVerticallyPlusIcon'); 
	_zoomVerticallyMinusIcon = document.getElementById('toolboxZoomVerticallyMinusIcon'); 
	_displayLinksDiv = document.getElementById('toolboxDisplayLinksDiv'); 
	_displayLinksIcon = document.getElementById('toolboxDisplayLinksIcon'); 
	_titlesPositioningDiv = document.getElementById('toolboxTitlesPositioningDiv'); 
	_titlesPositioningIcon = document.getElementById('toolboxTitlesPositioningIcon'); 
	_expandInput = document.getElementById('toolboxExpandInput');
	_expandAllIcon = document.getElementById('toolboxExpandAllIcon');
	_expandIcon = document.getElementById('toolboxExpandIcon');
	_expandPlusIcon = document.getElementById('toolboxExpandPlusIcon'); 
	_expandMinusIcon = document.getElementById('toolboxExpandMinusIcon'); 

	_containerDiv = document.getElementById("containerDiv");
	_containerSVG = document.getElementById("containerSVG");
	_tableHeaderSVG = document.getElementById('tableHeaderSVG');
	_tableContentSVG = document.getElementById('tableContentSVG');
	_ganttSVG = document.getElementById("ganttSVG");
	_timeSVG = document.getElementById("timeSVG");
	_verticalSplitterSVG = document.getElementById("verticalSplitterSVG");
	_tableScrollSVG = document.getElementById("tableScrollSVG");
	_ganttHScrollSVG = document.getElementById("ganttScrollSVG");
	_verticalScrollSVG = document.getElementById("verticalScrollSVG");

	let value = getCookie( "verticalSplitterPosition", 'float' );
	if( value ) {
		if( value > 0.0 && value < 1.0 ) {
			_settings.verticalSplitterInitialPosition = value;
		}
	}	
	_verticalSplitterPosition = _settings.verticalSplitterInitialPosition;
	
	initLayoutCoords();

	_containerDiv.addEventListener('selectstart', function(e) { e.preventDefault(); return false; } );
	_containerDiv.addEventListener('selectend', function(e) { e.preventDefault(); return false; } );
	
	// To scroll the table vertically - using the same handler as for the gantt chart... 
	addOnMouseWheel( _tableContentSVG, onGanttWheel );

	if( !_touchDevice ) {
		_verticalSplitterSVG.addEventListener('mousedown', onVerticalSplitterSVGMouseDown );
	} else {
		_verticalSplitterSVG.addEventListener('touchstart', onVerticalSplitterSVGTouchStart, true );
		_verticalSplitterSVG.addEventListener('touchmove', onVerticalSplitterSVGTouchMove, true );
		_verticalSplitterSVG.addEventListener('touchend', onVerticalSplitterSVGTouchEnd, true );
		_verticalSplitterSVG.addEventListener('touchcancel', onVerticalSplitterSVGTouchEnd, true );
	}

	// Gantt chart
	if( !_touchDevice ) {
		_ganttSVG.addEventListener( "mousedown", onGanttMouseDown );
		_ganttSVG.addEventListener( "mousemove", onGanttCapturedMouseMove );
		addOnMouseWheel( _ganttSVG, onGanttWheel );
		_ganttSVG.style.cursor = _settings.ganttSVGCursor;
		//_ganttSVG.addEventListener( "mouseup", onGanttCapturedMouseUp );
		//_ganttSVG.addEventListener( "dblclick", onGanttDblClick );
	} else {
		;//_ganttSVG.addEventListener( "touchstart", onGanttMouseDown );
		;//_ganttSVG.addEventListener( "touchmove", onGanttCapturedMouseMove );
	}

	// Time scale
	if( !_touchDevice ) {
		_timeSVG.addEventListener('mousedown', onGanttMouseDown);
		_timeSVG.addEventListener('mousemove', onGanttCapturedMouseMove);
		addOnMouseWheel( _timeSVG, onTimeWheel );	
		_timeSVG.style.cursor = _settings.timeSVGCursor;
		//_timeSVG.addEventListener( "dblclick", onGanttDblClick );
	} else {
		;//_timeSVG.addEventListener('touchstart', onGanttMouseDown);
		;//_timeSVG.addEventListener('touchmove', onGanttCapturedMouseMove);
	}

	// zoom tools
	if( !_touchDevice ) {
		_zoomHorizontallyInput.addEventListener('input', function() { filterInput(this); } );
		_zoomHorizontallyInput.addEventListener('blur', function(e) { onZoomHorizontallyBlur(this); } );
		_zoomHorizontallyIcon.addEventListener('mousedown', 
			function(e) { onZoomHorizontallyIcon(this, e, _zoomHorizontallyInput); } );
		_zoomHorizontallyMinusIcon.setAttribute( 'style', 'display:none' );
		_zoomHorizontallyPlusIcon.setAttribute( 'style', 'display:none' );
		_zoomVerticallyInput.addEventListener('input', function() { filterInput(this); } );
		_zoomVerticallyInput.addEventListener('blur', function(e) { onZoomVerticallyBlur(this); } );
		_zoomVerticallyIcon.addEventListener('mousedown', 
			function(e) { onZoomVerticallyIcon(this, e, _zoomVerticallyInput); } );
	    _zoomVerticallyMinusIcon.setAttribute( 'style', 'display:none' );
	    _zoomVerticallyPlusIcon.setAttribute( 'style', 'display:none' );

		_expandIcon.addEventListener('mousedown', function(e) { onExpandIcon(this, e); } );
	    _expandMinusIcon.setAttribute( 'style', 'display:none' );
	    _expandPlusIcon.setAttribute( 'style', 'display:none' );
		_expandInput.addEventListener('input', function(e) { filterInput(this,'([0-9]+)',1,100,1); } );
		_expandInput.addEventListener('blur', function(e) { onExpandBlur(); } );
	} else {
		_zoomHorizontallyInput.setAttribute( 'style', 'display:none' );
		_zoomVerticallyInput.setAttribute( 'style', 'display:none' );
		_zoomHorizontallyIcon.setAttribute( 'style', 'display:none' );
		_zoomVerticallyIcon.setAttribute( 'style', 'display:none' );
		_zoomHorizontallyMinusIcon.addEventListener('mousedown', 
			function(e) { onZoomHorizontallyMinusIcon(this, e, _zoomHorizontallyInput); } );
		_zoomHorizontallyPlusIcon.addEventListener('mousedown', 
			function(e) { onZoomHorizontallyPlusIcon(this, e, _zoomHorizontallyInput); } );
		_zoomVerticallyMinusIcon.addEventListener('mousedown', 
			function(e) { onZoomVerticallyMinusIcon(this, e, _zoomVerticallyInput); } );
		_zoomVerticallyPlusIcon.addEventListener('mousedown', 
			function(e) { onZoomVerticallyPlusIcon(this, e, _zoomVerticallyInput); } );

		_expandIcon.setAttribute( 'style', 'display:none' );
		_expandMinusIcon.addEventListener('mousedown', 
			function(e) { onExpandMinusIcon(this, e); } );
		_expandPlusIcon.addEventListener('mousedown', 
			function(e) { onExpandPlusIcon(this, e); } );

	}

	_expandAllIcon.addEventListener('mousedown', function(e) { _expandInput.value=_maxExpandableLevel; onExpandBlur(this); } );

	createDefs( _containerSVG );

	return true;
}

function zoomXYR( e, zoomIn, xOnly=false ) {
	let zoomFactorChange;
	if( zoomIn ) {
		zoomFactorChange = _settings.zoomFactor;
	} else {
		zoomFactorChange = -_settings.zoomFactor;
	}
	let x = (e.clientX - _ganttSVG.getAttributeNS(null,'x')); // To calculate x-location of click
	zoomX( zoomFactorChange,  x / _ganttSVGWidth );
	if( !xOnly ) {
		let y = e.clientY - getElementPosition(_containerDiv).y - _ganttSVG.getAttributeNS(null,'y'); // To calculate y-location of click
		zoomY( zoomFactorChange, y / _ganttSVGHeight );	
	} 

	drawTimeScale();
	drawGantt();
	drawGanttHScroll();	
	if( !xOnly ) {
		drawTableContent();		
		drawVerticalScroll();
	}
}


function initLayoutCoords() {
	let htmlStyles = window.getComputedStyle(document.querySelector("html"));
	let headerHeight = parseInt( htmlStyles.getPropertyValue('--header-height') );
	let toolboxTableHeight = parseInt( htmlStyles.getPropertyValue('--toolbox-table-height') );
	_containerDivHeight = window.innerHeight - headerHeight - _settings.scrollThick - toolboxTableHeight;

	_containerDiv.style.height = _containerDivHeight;
	_containerDiv.style.width = window.innerWidth;
	_containerDivX = _settings.containerHPadding;
	_containerDivY = headerHeight;
	_containerDivWidth = window.innerWidth - _settings.containerHPadding*2;
	_containerDiv.style.padding=`0px ${_settings.containerHPadding}px 0px ${_settings.containerHPadding}px`;

	_containerSVG.setAttributeNS(null, 'x', 0 );
	_containerSVG.setAttributeNS(null, 'y', 0 ); 
	_containerSVG.setAttributeNS(null, 'width', _containerDivWidth ); // window.innerWidth-1  );
	_containerSVG.setAttributeNS(null, 'height', _containerDivHeight ); 

	// Table Header
	_tableHeaderSVG.setAttributeNS(null, 'x', 0 );
	_tableHeaderSVG.setAttributeNS(null, 'y', 0 ); 
	_tableHeaderSVGWidth = _containerDivWidth * _verticalSplitterPosition;
	_tableHeaderSVG.setAttributeNS(null, 'width', _tableHeaderSVGWidth ); // window.innerWidth * 0.1 );
	_tableHeaderSVGHeight = parseInt(_containerDivHeight * 0.07);
	_tableHeaderSVG.setAttributeNS(null, 'height', _tableHeaderSVGHeight ); 
    _tableHeaderSVG.setAttribute('viewBox', `${_tableViewBoxLeft} 0 ${_tableHeaderSVGWidth} ${_tableHeaderSVGHeight}`);

	// Table Content
	_tableContentSVG.setAttributeNS(null, 'x', 0 );
	_tableContentSVG.setAttributeNS(null, 'y', _tableHeaderSVGHeight ); 
	_tableContentSVGWidth = _tableHeaderSVGWidth;
	_tableContentSVG.setAttributeNS(null, 'width', _tableContentSVGWidth ); // window.innerWidth * 0.1 );
	_tableContentSVGHeight = _containerDivHeight - _tableHeaderSVGHeight - _settings.scrollThick;
	_tableContentSVG.setAttributeNS(null, 'height', _tableContentSVGHeight ); 
    _tableContentSVG.setAttribute('viewBox', `${_tableViewBoxLeft} ${_tableViewBoxTop} ${_tableContentSVGWidth} ${_tableContentSVGHeight}`);

    //console.log(`wih = ${window.innerHeight}, divh=${_containerDivHeight}, th=${_tableHeaderSVGHeight}, tc=${_tableContentSVGHeight}`);
	
	// Vertical Splitter
	_verticalSplitterSVG.setAttributeNS(null, 'x', _tableContentSVGWidth );
	_verticalSplitterSVG.setAttributeNS(null, 'y', 0 ); 
	_verticalSplitterSVGWidth = _settings.verticalSplitterWidth; //_containerDivWidth * 0.005;
	_verticalSplitterSVG.setAttributeNS(null, 'width', _verticalSplitterSVGWidth ); // window.innerWidth * 0.9 );
	_verticalSplitterSVGHeight = _containerDivHeight - _settings.scrollThick;
	_verticalSplitterSVG.setAttributeNS(null, 'height', _containerDivHeight ); //window.innerHeight/2 ); 

	// Gantt chart
	_ganttSVG.setAttributeNS(null, 'x', _tableContentSVGWidth + _verticalSplitterSVGWidth );
	_ganttSVG.setAttributeNS(null, 'y', _tableHeaderSVGHeight ); 
	_ganttSVGWidth = _containerDivWidth - (_tableContentSVGWidth + _verticalSplitterSVGWidth) - _settings.verticalScrollThick;
	if(_ganttSVGWidth < 0 ) {
		_ganttSVGWidth = 0;
	}
	_ganttSVG.setAttributeNS(null, 'width', _ganttSVGWidth ); // window.innerWidth * 0.9 );
	_ganttSVGHeight = _tableContentSVGHeight;
	if( _ganttSVGHeight < 0 ) {
		_ganttSVGHeight = 0;
	}
	_ganttSVG.setAttributeNS(null, 'height', _ganttSVGHeight ); //window.innerHeight/2 );
    _ganttSVG.setAttribute('viewBox', `${_ganttViewBoxLeft} ${_ganttViewBoxTop} ${_ganttSVGWidth} ${_ganttSVGHeight}`);

	// Time scale
	_timeSVG.setAttributeNS(null, 'x', _tableContentSVGWidth + _verticalSplitterSVGWidth );
	_timeSVG.setAttributeNS(null, 'y', 0 ); 
	_timeSVGWidth = _ganttSVGWidth;
	_timeSVG.setAttributeNS(null, 'width', _timeSVGWidth ); // window.innerWidth * 0.9 );
	_timeSVGHeight = _tableHeaderSVGHeight;
	_timeSVG.setAttributeNS(null, 'height', _timeSVGHeight ); //window.innerHeight/2 );

	// Table scrolling tool
	_tableScrollSVG.setAttributeNS(null, 'x', 0 )
	_tableScrollSVG.setAttributeNS(null, 'y', _tableHeaderSVGHeight + _tableContentSVGHeight ); 
	_tableScrollSVGWidth = _tableHeaderSVGWidth;
	_tableScrollSVG.setAttributeNS(null, 'width', _tableContentSVGWidth ); // window.innerWidth * 0.1 );
	_tableScrollSVGHeight = _settings.scrollThick;
	_tableScrollSVG.setAttributeNS(null, 'height', _tableContentSVGHeight ); 

	// Gantt horizontal scrolling tool
	_ganttHScrollSVG.setAttributeNS(null, 'x', _tableContentSVGWidth + _verticalSplitterSVGWidth )
	_ganttHScrollSVG.setAttributeNS(null, 'y', _tableHeaderSVGHeight + _tableContentSVGHeight ); 
	_ganttHScrollSVGWidth = _ganttSVGWidth;
	_ganttHScrollSVG.setAttributeNS(null, 'width', _ganttHScrollSVGWidth );
	_ganttHScrollSVGHeight = _settings.scrollThick;
	_ganttHScrollSVG.setAttributeNS(null, 'height', _ganttHScrollSVGHeight ); 

	// Vertical scrolling tool
	_verticalScrollSVG.setAttributeNS(null, 'x', _tableContentSVGWidth + _verticalSplitterSVGWidth + _ganttSVGWidth )
	_verticalScrollSVG.setAttributeNS(null, 'y', _tableHeaderSVGHeight ); 
	_verticalScrollSVGWidth = _settings.verticalScrollThick;
	_verticalScrollSVG.setAttributeNS(null, 'width', _verticalScrollSVGWidth );
	_verticalScrollSVGHeight = _ganttSVGHeight; // _containerDivHeight;
	_verticalScrollSVG.setAttributeNS(null, 'height', _verticalScrollSVGHeight ); 
}


function displayHeaderAndFooterInfo() {
	let projectName = document.getElementById('projectName');
	projectName.innerText = _data.proj.Name + " (" + _data.proj.Code + ")";
	let elProjectAndTimeVersion = document.getElementById('projectTimeAndVersion');
	
	let uploadTime = '';
	if( 'UploadTime' in _data.proj ) {
		uploadTime = " / " + _texts[_lang].uploadTime + ": " + _data.proj.UploadTime;
	}
	if( !_touchDevice ) {
		let timeAndVersion = _data.proj.CurTime + uploadTime + " | " + _texts[_lang].version + ": " + _data.proj.ProjVer;
		elProjectAndTimeVersion.innerText = timeAndVersion;
	} else {
		projectName.setAttribute('style','font-size:18px;');
		elProjectAndTimeVersion.setAttribute('style','display:none');
	}

	if( _userName !== null ) {
		let el = document.getElementById('projectUser');
		el.innerHTML = _userName;
		/*
		if( !_touchDevice ) {
			el.innerHTML = `${_userName}<br/><a href='${_requests.logout}'>[&#10132;]</a>`; //
		} else {
			el.setAttribute('style','font-size:16px; text-decoration:underline;');
			el.innerHTML = "<span style='cursor:pointer;' onclick='logout();'>" + _userName +  "</span>"; //
		}
		*/
	}

	document.getElementById('helpTitle').innerText = _texts[_lang].helpTitle; // Initializing help text	
	document.getElementById('helpText').innerHTML = _texts[_lang].helpText; // Initializing help text	

	document.getElementById('toolboxResetTableDimensionsDiv').title = _texts[_lang].resetTableDimensionsTitle;
	document.getElementById('toolboxResetTableDimensionsIcon').setAttribute('src',_iconExportSettings);
	document.getElementById('toolboxZoom100Div').title = _texts[_lang].zoom100Title;
	document.getElementById('toolboxZoom100Icon').setAttribute('src',_iconZoom100);
	document.getElementById('toolboxZoomReadableDiv').title = _texts[_lang].zoomReadableTitle;
	document.getElementById('toolboxZoomReadableIcon').setAttribute('src',_iconZoomReadable);

	document.getElementById('toolboxZoomVerticallyDiv').title = _texts[_lang].zoomVerticallyTitle;
	document.getElementById('toolboxZoomVerticallyIcon').setAttribute('src',_iconZoomVertically);
	document.getElementById('toolboxZoomVerticallyPlusIcon').setAttribute('src',_iconZoomVerticallyPlus);
	document.getElementById('toolboxZoomVerticallyMinusIcon').setAttribute('src',_iconZoomVerticallyMinus);

	document.getElementById('toolboxZoomHorizontallyDiv').title = _texts[_lang].zoomHorizontallyTitle;
	document.getElementById('toolboxZoomHorizontallyIcon').setAttribute('src',_iconZoomHorizontally);
	document.getElementById('toolboxZoomHorizontallyPlusIcon').setAttribute('src',_iconZoomHorizontallyPlus);
	document.getElementById('toolboxZoomHorizontallyMinusIcon').setAttribute('src',_iconZoomHorizontallyMinus);

	document.getElementById('toolboxExpandAllIcon').title = _texts[_lang].expandAllIconTitle;
	document.getElementById('toolboxExpandAllIcon').setAttribute('src',_iconExpandAll);
	document.getElementById('toolboxExpandDiv').title = _texts[_lang].expandTitle;
	document.getElementById('toolboxExpandIcon').setAttribute('src',_iconExpand);
	document.getElementById('toolboxExpandPlusIcon').setAttribute('src',_iconExpandPlus);
	document.getElementById('toolboxExpandMinusIcon').setAttribute('src',_iconExpandMinus);

	document.getElementById('toolboxNewProjectDiv').title = _texts[_lang].titleNewProject;	
	document.getElementById('toolboxNewProjectIcon').setAttribute('src',_iconNewProject);


	// Displaying links status (ON or OFF)
	let displayLinks;
	let displayLinksCookie = getCookie( 'displayLinks', 'int' );
	if( displayLinksCookie === null ) {
		displayLinks = true;
	} else if( displayLinksCookie == 1 ) {
		displayLinks = true;
	} else {
		displayLinks = false;		
	}
	displayLinksStatus(displayLinks); 			// Initializing display/hide links tool

	displaySynchronizedStatus(); 		// Initializing syncho-data tool
}


function calcNotHiddenOperationsLength() {
	let numVisible = 0;
	for( let i = 0 ; i < _data.operations.length ; i++ ) {
		if( _data.operations[i].visible ) {
			numVisible += 1;
		}
	}
	_notHiddenOperationsLength = numVisible;
}

// Summary on operation displayed as a tooltip as well as in the "Edit" windows 
function formatTitleTextContent( i, html=false ) {
	let textContent = "";
	let endl = ( !html ) ? "\n" : "<br/>";

	let op = _data.operations[i].Name;
	if( html ) {
		op = "<b>" + op + "</b>" + endl;
	} else {
		op = op + endl + "---------------------------------------" + endl;
	}
	textContent = op;

	let statusText;
	if( _data.operations[i].status == 0 ) {
		statusText = _texts[_lang].status0;
	} else if( _data.operations[i].status < 100 ) {
		statusText = _data.operations[i].status + "%";
	} else {
		statusText = _texts[_lang].status100;				
	}
	textContent += "[ " + statusText + " ]" + endl;

	for( let col=1 ; col < _data.table.length ; col++ ) {
		if( !_data.table[col].visible ) {
			continue;
		}		
		if( _data.table[col].ref === 'Name' ) {
			continue;
		}
		if( _data.table[col].type === 'signal' ) {
			continue;
		}
		let ref = _data.table[col].ref;

		let content = _data.operations[i][ref];
		let name = _data.table[col].name;
		if( html ) {
			name = "<span style='color:#7f7f7f;'>" + name + "</span>";
		}
		if( content === 'undefined' || content == null ) {
			continue;
		}
		textContent += name + ": " + content + endl;
	}	
	return textContent;
}

function calcPhaseCoords( rectStart, rectTop, rectWidth, rectHeight, brackets=0 ) {
	let phaseBracketHeight = rectHeight * _settings.ganttRectBracketRelHeight;
	let thick = (rectWidth+rectWidth > _settings.ganttRectBracketThick) ? _settings.ganttRectBracketThick : 1;
	let rectEnd = rectStart + rectWidth;
	let rectBottom = rectTop + rectHeight;
	let phaseCoords;
	if( brackets == 0 ) { // Both brackets
		phaseCoords = rectStart+" "+rectTop+" "+rectEnd+" "+rectTop+" "+rectEnd+" "+rectBottom;
		phaseCoords += " "+(rectEnd - thick)+" "+(rectBottom-phaseBracketHeight);
		phaseCoords += " "+(rectStart + thick)+" "+(rectBottom-phaseBracketHeight)+" "+rectStart+" "+rectBottom;		
	} else if( brackets == 1 ) {  // Only right bracket
		phaseCoords = rectStart+" "+rectTop+" "+rectEnd+" "+rectTop+" "+rectEnd+" "+rectBottom;
		phaseCoords += " "+(rectEnd - thick)+" "+(rectBottom-phaseBracketHeight);
		phaseCoords += " "+rectStart+" "+(rectBottom-phaseBracketHeight);				
	} else { // Only left bracket
		phaseCoords = rectStart+" "+rectTop+" "+rectEnd+" "+rectTop+" "+rectEnd+" "+(rectBottom- phaseBracketHeight);
		phaseCoords += " "+(rectStart + thick)+" "+(rectBottom-phaseBracketHeight)+" "+rectStart+" "+rectBottom;		
	}
	return phaseCoords;
}


function drawVerticalSplitter( init=false ) {
	if( init ) {
		while (_verticalSplitterSVG.hasChildNodes()) {
			_verticalSplitterSVG.removeChild(_verticalSplitterSVG.lastChild);
		}		
		_verticalSplitterSVG.setAttributeNS(null,'cursor','col-resize');	
		_verticalSplitterSVGBkgr = createRect( 0, 0, _verticalSplitterSVGWidth, _verticalSplitterSVGHeight, 
				{ strokeWidth:1, stroke:_settings.verticalSplitterStrokeColor, fill:_settings.verticalSplitterBkgrColor } ); 
		_verticalSplitterSVG.appendChild( _verticalSplitterSVGBkgr );					
	}
}


function zoomX100() {
	_ganttVisibleLeft = _data.visibleMin;
	_ganttVisibleWidth = _data.visibleMaxWidth;
	_zoomHorizontallyInput.value = 100;
	setCookie("ganttVisibleLeft",_ganttVisibleLeft);
	setCookie("ganttVisibleWidth",_ganttVisibleWidth);	
}


function moveX( positionChange ) {
	_ganttVisibleLeft = validateGanttLeft(_ganttVisibleLeft + positionChange);
	setCookie("ganttVisibleLeft",_ganttVisibleLeft);
}

function moveXR( positionChange ) {
	moveX( positionChange );
	drawGantt(false,true);
	//drawGantt(true,false);
	drawTimeScale();
	drawGanttHScroll();
}


function zoomX( zoomFactorChange, centerOfZoom=0.5 ) {
	let currentZoomFactor = _data.visibleMaxWidth / _ganttVisibleWidth;

	let newZoomFactor;
	if( typeof(zoomFactorChange) == 'string' ) { // Changing logarithmically...
		if( zoomFactorChange === '+' ) {
			newZoomFactor = currentZoomFactor * (1.0 + _settings.zoomFactor);
		} else {
			newZoomFactor = currentZoomFactor / (1.0 + _settings.zoomFactor);			
		}
	} else { // Changing incrementally...
		newZoomFactor = currentZoomFactor + zoomFactorChange;
	}

	if( newZoomFactor < _settings.minXZoomFactor ) {
		newZoomFactor = _settings.minXZoomFactor;
	}

	let maxZoomFactor = _data.visibleMaxWidth / _settings.minSecondsZoomed;
	if( newZoomFactor > maxZoomFactor ) {
		newZoomFactor = maxZoomFactor;
	}

	if( centerOfZoom < 0.1 ) {
		centerOfZoom = 0.0;
	} else if( centerOfZoom > 0.9 ) {
		centerOfZoom = 1.0;
	}
	let newWidth = _data.visibleMaxWidth / newZoomFactor;
	let newLeft = _ganttVisibleLeft - (newWidth - _ganttVisibleWidth) * centerOfZoom;				
	if( newLeft < _data.visibleMin ) {
		newLeft = _data.visibleMin;
	} else if( newLeft + newWidth > _data.visibleMax ) {
		newLeft = _data.visibleMax - newWidth; //_data.visibleMin;
	}
	_ganttVisibleLeft = newLeft;
	_ganttVisibleWidth = newWidth;
	displayXZoomFactor( newZoomFactor );
}


function displayXZoomFactor( zoomFactor=null ) {
	if( zoomFactor === null ) {
		zoomFactor = _data.visibleMaxWidth / _ganttVisibleWidth;
	} 
	_zoomHorizontallyInput.value = parseInt(zoomFactor*100.0 + 0.5);
	setCookie("ganttVisibleLeft",_ganttVisibleLeft);
	setCookie("ganttVisibleWidth",_ganttVisibleWidth);
}


function zoomXR( factorChange, centerOfZoom=0.5 ) { // Zoom and redraw
	zoomX( factorChange, centerOfZoom );		
	drawGantt();
	drawTimeScale();
	drawGanttHScroll();	
}

function validateGanttLeft( left ) {
	let maxLeft = getGanttMaxLeft(); 
	if( left > maxLeft ) {
		left = maxLeft;
	}
	if( left < _data.visibleMin ) {
		left = _data.visibleMin;
	}
	return left;
}

function getGanttMaxLeft() {
	let maxLeft = _data.visibleMax - _ganttVisibleWidth * (1.0 - _settings.ganttVisibleWidthExtra);
	return maxLeft; 	
}

function zoomY100() {
	_visibleTop = 0;
	_visibleHeight = _notHiddenOperationsLength; // _data.operations.length;
	_zoomVerticallyInput.value = 100;
	setCookie("ganttVisibleTop",_visibleTop);
	setCookie("ganttVisibleHeight",_visibleHeight);
} 

function moveY( positionChange ) {
	if( _notHiddenOperationsLength <= _visibleHeight ) { 	// If content does not go beyond the screen by height - returning immediately...
		return;
	}          
	let newY = _visibleTop + positionChange;
	if( newY < 0 ) {
		newY = 0;
	} else if( newY + _visibleHeight > _notHiddenOperationsLength ) {
		newY = _notHiddenOperationsLength - _visibleHeight;
	}
	_visibleTop = newY;
	setCookie("ganttVisibleTop",_visibleTop);
}

function moveYR( positionChange ) {
	moveY( positionChange );
	drawGantt(false,true);
	drawTableContent(false,true);
	drawVerticalScroll();
}


function calcMinVisibleHeight() {
	return _settings.minNumberOfOperationsOnScreen; // THE CODE USED BEFORE: (_notHiddenOperationsLength > 5) ? 5.0 : _notHiddenOperationsLength;	
}


function calcMaxVisibleHeight() {
	let maxOp = _settings.maxNumberOfOperationsOnScreen;
	let minOp = _settings.minNumberOfOperationsOnScreen;
	return (_notHiddenOperationsLength >= maxOp) ? maxOp : (_notHiddenOperationsLength > minOp) ? _notHiddenOperationsLength : minOp;

}

function zoomY( zoomFactorChange, centerOfZoom=0.5 ) {
	let currentZoomFactor = _notHiddenOperationsLength / _visibleHeight;
	let minVisibleHeight = calcMinVisibleHeight();
	let maxZoomFactor = _notHiddenOperationsLength / minVisibleHeight;
	let maxVisibleHeight = calcMaxVisibleHeight();
	let minZoomFactor = _notHiddenOperationsLength / maxVisibleHeight;

	let newZoomFactor;
	if( typeof(zoomFactorChange) == 'string' ) { // Changing logarthmically...
		if( zoomFactorChange === '+' ) {
			newZoomFactor = currentZoomFactor * (1.0 + _settings.zoomFactor);
		} else {
			newZoomFactor = currentZoomFactor / (1.0 + _settings.zoomFactor);			
		}
	} else { // Changing incrementally...
		newZoomFactor = currentZoomFactor + zoomFactorChange;
	}

	if( newZoomFactor > maxZoomFactor ) { 
		newZoomFactor = maxZoomFactor;
	}
	if( newZoomFactor < minZoomFactor ) { 
		newZoomFactor = minZoomFactor;
	}
	
	let newHeight = _notHiddenOperationsLength / newZoomFactor;
	
	if( centerOfZoom < 0.1 ) {
		centerOfZoom = 0.0;
	} else if ( centerOfZoom > 0.9 ) {
		centerOfZoom = 1.0;
	} 
	let newY = _visibleTop - (newHeight - _visibleHeight) * centerOfZoom;	
	if( newY < 0 ) {
		newY = 0;
	} else if( newY + newHeight > _notHiddenOperationsLength ) {
		newY = 0;
	}
	_visibleTop = newY;
	_visibleHeight = newHeight;
	displayYZoomFactor( newZoomFactor );
}


function displayYZoomFactor( zoomFactor=null ) {
	if( zoomFactor === null ) {
		zoomFactor = _notHiddenOperationsLength / _visibleHeight;
	}
	_zoomVerticallyInput.value = parseInt(zoomFactor*100.0 + 0.5);
	setCookie("ganttVisibleTop",_visibleTop);
	setCookie("ganttVisibleHeight",_visibleHeight);

}


function zoomYR( factorChange, centerOfZoom=0.5, setZoomFactor=null ) {
	zoomY( factorChange, centerOfZoom, setZoomFactor );		
	drawTableContent();
	drawTimeScale();
	drawGantt();
	drawVerticalScroll();	
}


function reassignBoundaryValue( knownBoundary, newBoundary, upperBoundary ) {
	if( knownBoundary == -1 ) {
		return newBoundary;
	} 
	if( newBoundary == -1 ) {
		return knownBoundary;
	}
	if( !upperBoundary ) { // Min.
		if( newBoundary < knownBoundary ) {
			return newBoundary;			
		} 
	} else { // Max.
		if( newBoundary > knownBoundary ) {
			return newBoundary;			
		} 		
	}
	return knownBoundary;
}

function getElementPosition(el) {
	let lx=0, ly=0
    for( ; el != null ; ) {
		lx += el.offsetLeft;
		ly += el.offsetTop;
		el = el.offsetParent;    	
    }
    return {x:lx, y:ly};
}

function addOnMouseWheel(elem, handler) {
	if (elem.addEventListener) {
		if ('onwheel' in document) {           // IE9+, FF17+
			elem.addEventListener("wheel", handler);
		} else if ('onmousewheel' in document) {           //
			elem.addEventListener("mousewheel", handler);
		} else {          // 3.5 <= Firefox < 17
			elem.addEventListener("MozMousePixelScroll", handler);
		}
	} else { // IE8-
		elem.attachEvent("onmousewheel", handler);
	}
}


function timeToScreen( timeInSeconds, absoluteMin=true ) {
	let availableSVGWidth = _ganttSVGWidth - _settings.ganttChartLeftMargin - _settings.ganttChartRightMargin;
	let min;
	if( absoluteMin ) {
		min = _data.visibleMin;
	} else {
		min = _ganttVisibleLeft;
	}
	return parseInt( _settings.ganttChartLeftMargin + (timeInSeconds - min) * availableSVGWidth / _ganttVisibleWidth + 0.5); 
}

function timeToScreenInt( timeInSeconds ) {
	let x = timeToScreen(timeInSeconds);
	return parseInt(x+0.5); 
}

function screenToTime( screenX ) {
	let xNotScaled = screenX * (_ganttVisibleWidth - 1) / (_ganttSVGWidth-1);
}


function operToScreen( n ) {
	return parseInt( n * _ganttSVGHeight / (_visibleHeight+0.5) + 0.5); 
} 


function calcTableHeaderOverallWidth() {
	let w = 0; 
	for( let col = 0 ; col < _data.table.length ; col++ ) {
		w += _data.table[col].width;
	}	
	_tableHeaderOverallWidth = w;
}


function calcNumberOfVisibleOperations() {
	let n = 0;
	for( let i = 0 ; i < _data.operations.length ; i++ ) {
		if(_data.operations[i].visible ) {
			n++;
		}
	}	
	_data.numberOfVisibleOperations = n;
}


function newProject() {
	let cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
    	let namevalue = cookies[i].split('=');
    	if( namevalue ) {
	    	if( namevalue.length == 2 ) {
	    		let cname = trimString(namevalue[0]);
		    		if( cname.length > 0 ) {
		    		if( cname.indexOf('verticalSplitterPosition') == 0 ) { // Skipping vertical splitter position for it iss a browser setting only
		    			continue;
		    		}
			    	deleteCookie( cname );	    			
	    		}
	    	}
    	}
    }
	location.reload();
}


function resetCookies() {

	deleteCookie('ganttVisibleTop');
	deleteCookie('ganttVisibleHeight');

	for( let cookie = 0 ; cookie < 100000 ; cookie++ ) {
		let cname = _data.table[cookie].ref+"Position";
		if( getCookie(cname) != null ) {
			deleteCookie( cname );
		} else {
			break;
		}
	}
	deleteCookie('ganttVisibleWidth'); 	// Saving new values in cookies...
	deleteCookie('ganttVisibleLeft'); 		// 
}


function restoreExportedSettings(redraw=true) {
	_visibleTop = 0;
	_visibleHeight = _settings.readableNumberOfOperations;
	setCookie('ganttVisibleTop', 0);
	setCookie('ganttVisibleHeight', _settings.readableNumberOfOperations);

	copyArrayOfObjects( _data.initialTable, _data.table );
	for( let cookie = 0 ; cookie < _data.table.length ; cookie++ ) {
		let cname = _data.table[cookie].ref+"Position";
		if( getCookie(cname) != null ) {
			deleteCookie( cname );
		}
		cname = _data.table[cookie].ref+"Width";
		setCookie( cname, _data.table[cookie].width );
	}
	if( redraw ) {
		drawTableHeader(true);
		drawTableContent(true);
		drawTableScroll();
		drawVerticalScroll();		
	}
	let gvw = _secondsInPixel * _ganttSVGWidth; 		// Calculating gantt width out of scale
	if( gvw > 60*60 && !(gvw > _data.visibleMaxWidth) ) {
		_ganttVisibleWidth = gvw;
	} else {
		_ganttVisibleWidth = _data.visibleMaxWidth;
	}
	_ganttVisibleLeft = _data.visibleMin;
	setCookie('ganttVisibleWidth', _ganttVisibleWidth); 	// Saving new values in cookies...
	setCookie('ganttVisibleLeft', _ganttVisibleLeft); 		// 
	if( redraw ) {
		drawGantt();
		drawTimeScale();
		drawGanttHScroll();			
	}
}


function validateTopAndHeight( top, height ) {
	let minVisibleHeight = calcMinVisibleHeight();
	let maxVisibleHeight = calcMaxVisibleHeight();
	let newVisibleHeight;
	if( height < minVisibleHeight ) {
		newVisibleHeight = minVisibleHeight;
	} else if( height > maxVisibleHeight ) {
		newVisibleHeight = maxVisibleHeight;
	} else {
		newVisibleHeight = height;
	}
	if( top < 0 ) {
		top = 0;
	}
	let newVisibleTop = (top + newVisibleHeight) <= _notHiddenOperationsLength ? top : Math.max(0,_notHiddenOperationsLength - newVisibleHeight);
	//console.log(`top=${top}, newVisibleTop=${newVisibleTop}, _notHiddenOperationsLength=${_notHiddenOperationsLength}, newVisibleHeight=${newVisibleHeight}`);
	return [newVisibleTop, newVisibleHeight ]	
}


function calculateHorizontalZoomByVerticalZoom( top, height ) {
	let th = validateTopAndHeight( top, height );
	let newVisibleHeight = th[1]; // (_notHiddenOperationsLength < height) ? _notHiddenOperationsLength : height;
	let newVisibleTop = th[0]; (top + newVisibleHeight) <= _notHiddenOperationsLength ? top : (_notHiddenOperationsLength - newVisibleHeight);
	
	if( _notHiddenOperationsLength > height ) {		
		let min = _data.operations[0].displayStartInSeconds;
		let max = _data.operations[0].displayFinInSeconds;
		for( let i = 1 ; i < newVisibleHeight ; i++ ) {
			d = _data.operations[i];
			if( d. displayStartInSeconds < min ) {
				min = d.displayStartInSeconds;
			} 
			if( d.displayFinInSeconds > max ) {
				max = d.displayFinInSeconds;
			}

		}
		newVisibleLeft = min;
		newVisibleWidth = max - min;
	} else {		
		newVisibleLeft = _data.visibleMin;
		newVisibleWidth = _data.visibleMaxWidth;
	}
	return [ newVisibleTop, newVisibleHeight, newVisibleLeft, newVisibleWidth ];
}


function zoomReadable(e) {
	zoomR( false );
}

function zoom100(e) {
	zoomR( true );
}

function zoomR( zoomH100 = true ) {
	if( zoomH100 ) {
		let th = validateTopAndHeight( 0, _settings.maxNumberOfOperationsOnScreen );
		_visibleTop = th[0];
		_visibleHeight = th[1];
		_ganttVisibleLeft = _data.visibleMin;
		_ganttVisibleWidth = _data.visibleMaxWidth;

	} else {
		let newZoom = calculateHorizontalZoomByVerticalZoom( 0, _settings.readableNumberOfOperations );
		_visibleTop = newZoom[0];
		_visibleHeight = newZoom[1];
		_ganttVisibleLeft = newZoom[2];
		_ganttVisibleWidth = newZoom[3];
	}

	displayXZoomFactor();
	displayYZoomFactor();

	drawGantt(true);
	drawTimeScale();
	drawGanttHScroll();	
	drawTableContent(true);		
	drawVerticalScroll();
}


function expandToLevel( level=null, redraw=false ) {
	if( level === null ) {
		level = _maxExpandableLevel;
	} 
	for( let i = 0 ; i < _data.operations.length ; i++ ) {
		// console.log(`level=${_data.operations[i].Level}, parents=${_data.operations[i].parents.length}`);
		if( _data.operations[i].parents.length < level-1 ) {
			_data.operations[i].expanded = true;
			_data.operations[i].visible = true;
		} else if( _data.operations[i].parents.length == level-1 ) {
			_data.operations[i].expanded = false;
			_data.operations[i].visible = true;
		} else {
			_data.operations[i].expanded = false;
			_data.operations[i].visible = false;
		}
	}
	if( redraw ) {
		setVisibleTopAndHeightAfterExpand();
		drawTableContent();
		drawGantt(true);
		displayYZoomFactor();
		drawVerticalScroll();
		drawGanttHScroll();	

	}
}
