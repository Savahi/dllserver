
var NS = "http://www.w3.org/2000/svg";

var _redrawAllMode=false;
var _touchDevice = false;
var _dateDMY=true;
var _ganttMTime = -1;
var _titlesPositioning = 'r';
var _dataSynchronized = 1;
var _synchronizationRate = 15*1000; 	// How often connection with the server is checked...
var _data;

var _lang="ru";
var _dateDelim="";
var _timeDelim="";
var _dateFormat="";
var _secondsInPixel=13708;
var _expandToLevelAtStart=3;

var _settings = {
	tableHeaderFontColor:'#4f4f4f',	tableHeaderFillColor:'#cfcfdf', tableHeaderColumnSplitterColor:'#bfbfcf',
	tableHeaderBorderColor:'#cfcfdf', tableHeaderActiveBorderColor:'#8f8f9f', 
	tableContentFontColor:'#4f4f4f', tableContentFillColor:'#efefff', tableContentStrokeColor:'#4f4f4f', 
	tableHeaderColumnHMargin:3, tableColumnHMargin:2, tableColumnTextMargin:2, 
	tableMaxFontSize:14, tableMinFontSize:2, minTableColumnWidth:4, hierarchyIndent:4,	
	editedColor:"#bf2f2f", zoomFactor:0.25, containerHPadding:2, 
	webExportLineNumberColumnName:'f_WebExportLineNumber', webExportFileNamesColumn:'Folder', webExportUserFileNamesColumn:'FolderAlt',
	webExportFileNameKey:'__FileName', webExportUserFileNameKey:'__UserFileName', webExportFilesNumber:4,
	readableNumberOfOperations:28, maxNumberOfOperationOnScreen:50
}

var _requests = { data:"/.input_data", logout:"/.logout", save:"/.save_input", check_synchro:"/.check_input_synchro" };

var _zoomVerticallyInput = null; 
var _zoomVerticallyPlusIcon = null;
var _zoomVerticallyMinusIcon = null;

var _containerDiv = null;
var _containerSVG = null;
var _tableContentSVG = null;
var _tableContentSVGContainer = null;
var _tableHeaderSVG = null;

var _containerDivX, _containerDivY, _containerDivHeight, _containerDivWidth;

var _visibleTop;      // Gantt & Table top visible operation 
var _visibleHeight;   // Gantt & Table visible operations number
var _notHiddenOperationsLength=0;

var _tableContentSVGWidth;
var _tableContentSVGHeight;
var _tableContentSVGBkgr=null;

var _tableHeaderSVGWidth;
var _tableHeaderSVGHeight;
var _tableHeaderSVGBkgr=null;
var _tableOverallWidth=0;
var _tableContentOverallHeight=0;

window.addEventListener( "load", onWindowLoad );

window.addEventListener( "contextmenu", onWindowContextMenu );

window.addEventListener( "resize", onWindowResize );

window.addEventListener( 'mouseup', onWindowMouseUp, true );
window.addEventListener( 'touchcancel', onWindowMouseUp, true );
window.addEventListener( 'touchend', onWindowMouseUp, true );
window.addEventListener( 'mousemove', onWindowMouseMove );
window.addEventListener( 'touchmove', onWindowMouseMove );	


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
			    		//alert('Error: ' + e.name + ":" + e.message + "\n" + e.stack + "\n" + e.cause);
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
					// Adding the first column with expend tool
					_data.table.unshift( { "name":"[]", "ref":"expandColumn", "width":2, "visible":true, "type":null,"format":null } );

			    	if( _data.operations.length > 400 ) {
			    		_redrawAllMode = true;
			    	}

					if( 'parameters' in _data ) {
						if( 'lang' in _data.parameters )
							_lang = _data.parameters.lang;
						if( 'dateDelim' in _data.parameters )
							_dateDelim = _data.parameters.dateDelim;
						if( 'timeDelim' in _data.parameters )
							_timeDelim = _data.parameters.timeDelim;
						if( 'dateFormat' in _data.parameters )
							_dateFormat = _data.parameters.dateFormat;
						if( 'expandToLevelAtStart' in _data.parameters )
							_expandToLevelAtStart = _data.parameters.expandToLevelAtStart;
						if( 'userName' in _data.parameters ) {
							_userName = _data.parameters.userName;
						} else {
							_userName = getCookie('user');
						}
					}

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

					hideMessageBox();		    
					if( initData() == 0 ) {
						displayData();		
			        	setTimeout( ifSynchronizedCheck, _synchronizationRate );
		        	}
				} else {
					displayMessageBox( _texts[_lang].errorLoadingData ); 
				}
		    }
		};
		let requestUrl = _requests.data + ((window.location.search.length > 0) ? (window.location.search) : ''); 
		xmlhttp.open("GET", _requests.data, true);
		xmlhttp.setRequestHeader("Cache-Control", "no-cache");
		xmlhttp.send();
		displayMessageBox( _texts[_lang].waitDataText ); 
	} 
}

function displayData() {	
	displayHeaderAndFooterInfo();	
	calcAndSetTableDimensions();
	drawTableHeader(true);
	drawTableContent(true);
}

function initData() {
	var curTimeParsed = parseDate( _data.proj.CurTime );
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

	_data.startFinSeconds = _data.finMaxInSeconds - _data.startMinInSeconds;
	_data.visibleMin = _data.startMinInSeconds; // - (_data.finMaxInSeconds-_data.startMinInSeconds)/20.0;
	_data.visibleMax = _data.finMaxInSeconds; // + (_data.finMaxInSeconds-_data.startMinInSeconds)/20.0;
	_data.visibleMaxWidth = _data.visibleMax - _data.visibleMin;

	// Initializing the parent-children structure and the link structure
	for( let i = 0 ; i < _data.operations.length ; i++ ) {
		_data.operations[i].id = 'ganttRect' + i; // Id
		initParents(i);
		_data.operations[i]._isPhase = (typeof(_data.operations[i].Level) === 'number') ? true : false;
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
	let topAndHeight = validateTopAndHeight( 0, _settings.readableNumberOfOperations );
	_visibleTop = topAndHeight[0];
	_visibleHeight = topAndHeight[1];

	// Reading and validating top and height saved in cookies
	let gvt = getCookie('visibleTop', 'float');
	let gvh = getCookie('visibleHeight', 'float');
	//if( gvh ) { console.log('GVH FOUND!!!!' + gvh);}
	if( gvt || gvh ) {
		if( !gvt ) { gvt = _visibleTop; }
		if( !gvh ) { gvh = _visibleHeight; }
		let savedTopAndHeightValidated = validateTopAndHeight( gvt, gvh );
		_visibleTop = savedTopAndHeightValidated[0];
		_visibleHeight = savedTopAndHeightValidated[1];
	}
	displayYZoomFactor();

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
		if( currentLevel === null ) { // Current level is an operation
			if( typeof(_data.operations[i].Level) === 'number' ) {
				_data.operations[iOperation].parents.push(i);
			}
		} else if( typeof(currentLevel) === 'number' ) { // Current level is a phase
			if( typeof(_data.operations[i].Level) === 'number' ) {
				if( _data.operations[i].Level < currentLevel ) {
					_data.operations[iOperation].parents.push(i);
				}
			}
		} else if( typeof(currentLevel) === 'string' ) { // Current level is a team or resourse
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
	_zoomVerticallyInput = document.getElementById('toolboxZoomVerticallyInput'); 
	_zoomVerticallyPlusIcon = document.getElementById('toolboxZoomVerticallyPlusIcon'); 
	_zoomVerticallyMinusIcon = document.getElementById('toolboxZoomVerticallyMinusIcon'); 

	_containerDiv = document.getElementById("containerDiv");
	_containerSVG = document.getElementById("containerSVG");
	_tableHeaderSVG = document.getElementById('tableHeaderSVG');
	_tableContentSVG = document.getElementById('tableContentSVG');
	
	initLayoutCoords();

	_containerDiv.addEventListener('selectstart', function() { event.preventDefault(); return false; } );
	_containerDiv.addEventListener('selectend', function() { event.preventDefault(); return false; } );

	_zoomVerticallyInput.addEventListener('input', function() { filterInput(this); } );
	_zoomVerticallyInput.addEventListener('blur', function(e) { onZoomVerticallyBlur(this); } );
	_zoomVerticallyPlusIcon.addEventListener('mousedown', function(e) { onZoomVerticallyIcon(this, 1, _zoomVerticallyInput); } );
	_zoomVerticallyMinusIcon.addEventListener('mousedown', function(e) { onZoomVerticallyIcon(this, -1, _zoomVerticallyInput); } );
	
	return true;
}

function initLayoutCoords() {
	let htmlStyles = window.getComputedStyle(document.querySelector("html"));
	let headerHeight = parseInt( htmlStyles.getPropertyValue('--header-height') );
	let toolboxTableHeight = parseInt( htmlStyles.getPropertyValue('--toolbox-table-height') );
	_containerDivHeight = window.innerHeight - headerHeight - toolboxTableHeight;

	_containerDiv.style.height = _containerDivHeight + "px";
	_containerDiv.style.width = window.innerWidth + "px";

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
	_tableHeaderSVGWidth = _containerDivWidth;
	_tableHeaderSVG.setAttributeNS(null, 'width', _tableHeaderSVGWidth ); // window.innerWidth * 0.1 );
	_tableHeaderSVGHeight = parseInt(_containerDivHeight * 0.07);
	_tableHeaderSVG.setAttributeNS(null, 'height', _tableHeaderSVGHeight ); 
    //_tableHeaderSVG.setAttribute('viewBox', `${_tableViewBoxLeft} 0 ${_tableHeaderSVGWidth} ${_tableHeaderSVGHeight}`);

	// Table Content
	_tableContentSVG.setAttributeNS(null, 'x', 0 );
	_tableContentSVG.setAttributeNS(null, 'y', _tableHeaderSVGHeight ); 
	_tableContentSVGWidth = _tableHeaderSVGWidth;
	_tableContentSVG.setAttributeNS(null, 'width', _tableContentSVGWidth ); // window.innerWidth * 0.1 );
	_tableContentSVGHeight = _containerDivHeight - _tableHeaderSVGHeight;
	_tableContentSVG.setAttributeNS(null, 'height', _tableContentSVGHeight ); 
}


function displayHeaderAndFooterInfo() {
	let projectName = document.getElementById('projectName');
	projectName.innerText = _data.proj.Name;

	let timeAndVersion = _data.proj.CurTime + " | " + _texts[_lang].version + ": " + _data.proj.ProjVer;
	document.getElementById('projectTimeAndVersion').innerText = timeAndVersion;
	if( _userName !== null ) {
		let el = document.getElementById('projectUser');
		//el.innerHTML = `${_userName}<br/><a href='${_requests.logout}'>[&#10132;]</a>`; //
		el.innerHTML = _userName;
	}

	document.getElementById('helpTitle').innerText = _texts[_lang].helpTitle; // Initializing help text	
	document.getElementById('helpText').innerHTML = _texts[_lang].helpText; // Initializing help text	

	document.getElementById('toolboxResetTableDimensionsDiv').title = _texts[_lang].resetTableDimensionsTitle;
	document.getElementById('toolboxResetTableDimensionsIcon').setAttribute('src',_iconExportSettings);
	document.getElementById('toolboxZoomVerticallyDiv').title = _texts[_lang].zoomVerticallyTitle;
	document.getElementById('toolboxZoomVerticallyPlusIcon').setAttribute('src',_iconZoomVerticallyPlus);
	document.getElementById('toolboxZoomVerticallyMinusIcon').setAttribute('src',_iconZoomVerticallyMinus);
	document.getElementById('toolboxNewProjectDiv').title = _texts[_lang].titleNewProject;	
	document.getElementById('toolboxNewProjectIcon').setAttribute('src',_iconNewProject);

	displaySynchronizedStatus(); 		// Initializing syncho-data tool
}


function zoomY100() {
	_visibleTop = 0;
	_visibleHeight = _notHiddenOperationsLength; // _data.operations.length;
	_zoomVerticallyInput.value = 100;
	setCookie("visibleTop",_visibleTop);
	setCookie("visibleHeight",_visibleHeight);
} 


function calcMinVisibleHeight() {
	return (_notHiddenOperationsLength > 5) ? 5.0 : _notHiddenOperationsLength;	
}


function calcMaxVisibleHeight() {
	let maxOp = _settings.maxNumberOfOperationOnScreen;
	return (_notHiddenOperationsLength >= maxOp) ? maxOp : _notHiddenOperationsLength;

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
	setCookie("visibleTop",_visibleTop);
	setCookie("visibleHeight",_visibleHeight);

}


function zoomYR( factorChange, centerOfZoom=0.5, setZoomFactor=null ) {
	zoomY( factorChange, centerOfZoom, setZoomFactor );		
	calcAndSetTableDimensions();
	drawTableContent();
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


function operToScreen( n ) {
	return parseInt( n * _tableContentSVGHeight / _visibleHeight + 0.5); 
} 


function calcAndSetTableDimensions(setWidth=true) {
	if( setWidth ) {
		let w = 0; 
		for( let col = 0 ; col < _data.table.length ; col++ ) {
			w += _data.table[col].width;
		}	
		_tableOverallWidth = w;
		_containerSVG.setAttributeNS(null, 'width', _tableOverallWidth);
		_tableHeaderSVG.setAttributeNS(null, 'width', _tableOverallWidth);
		_tableContentSVG.setAttributeNS(null, 'width', _tableOverallWidth);
		_tableHeaderSVGWidth = _tableOverallWidth;
		_tableContentSVGWidth = _tableOverallWidth;
	}
	_tableContentOverallHeight = operToScreen( _notHiddenOperationsLength );	
	_containerSVG.setAttributeNS(null, 'height', _tableContentOverallHeight + _tableHeaderSVGHeight);
	_tableContentSVG.setAttributeNS(null, 'height', _tableContentOverallHeight);
	_tableContentSVGheight = _tableContentOverallHeight;
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


function newProject() {
	let cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
    	let namevalue = cookies[i].split('=');
    	if( namevalue ) {
	    	if( namevalue.length == 2 ) {
	    		let cname = trimString(namevalue[0]);
		    		if( cname.length > 0 ) {
		    		if( cname.indexOf('verticalSplitterPosition') == 0 ) { // Skipping vertical splitter position for it is a browser setting only
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

	deleteCookie('visibleTop');
	deleteCookie('visibleHeight');

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
	setCookie('visibleTop', 0);
	setCookie('visibleHeight', _settings.readableNumberOfOperations);

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
	let newVisibleTop = (top + newVisibleHeight) <= _notHiddenOperationsLength ? top : (_notHiddenOperationsLength - newVisibleHeight);
	return [newVisibleTop, newVisibleHeight ]	
}


function zoomReadable(e) {
	zoomR( false );
}

function zoom100(e) {
	zoomR( true );
}

function zoomR( zoomH100 = true ) {
	if( zoomH100 ) {
		let th = validateTopAndHeight( 0, _settings.maxNumberOfOperationOnScreen );
		_visibleTop = th[0];
		_visibleHeight = th[1];

	} else {
		let newZoom = calculateHorizontalZoomByVerticalZoom( 0, _settings.readableNumberOfOperations );
		_visibleTop = newZoom[0];
		_visibleHeight = newZoom[1];
	}

	displayYZoomFactor();
	drawTableContent();		
}

