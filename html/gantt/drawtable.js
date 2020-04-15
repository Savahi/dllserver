
function drawTableHeader( init=false, shiftOnly=false ) {
    let thViewBox = `${_tableViewBoxLeft} 0 ${_tableHeaderSVGWidth} ${_tableHeaderSVGHeight}`;
    _tableHeaderSVG.setAttributeNS(null,'viewBox',thViewBox);
    if( shiftOnly ) {
        return;
    }   

    calcTableHeaderOverallWidth();
	if( init ) {
		while (_tableHeaderSVG.hasChildNodes()) {
			_tableHeaderSVG.removeChild(_tableHeaderSVG.lastChild);
		}

		_tableHeaderSVGBkgr = createRect( 0, 0, _tableHeaderOverallWidth, _tableHeaderSVGHeight, 
			{ id:'tableHeaderBkgr', fill:_settings.tableHeaderFillColor } ); // backgroud rect
		_tableHeaderSVG.appendChild( _tableHeaderSVGBkgr );			

		let left = _data.table[0].width;
		for( let col = 1 ; col < _data.table.length ; col++ ) {
			let rectWidth = _data.table[col].width - _settings.tableHeaderColumnHMargin * 2; // The width of SVG-container
			let svg = createSVG( left+_settings.tableHeaderColumnHMargin, 0, rectWidth, _tableHeaderSVGHeight, // SVG-container
				{ id:'tableHeaderColumnNameSVG'+col, 'fill':_settings.tableHeaderFillColor } );
			left += _data.table[col].width;
			let props = { id:'tableHeaderColumnNameBkgr'+col, 'fill':_settings.tableHeaderFillColor, 
				'stroke':_settings.tableHeaderBorderColor, 'strokeWidth':1 };
			let rect = createRect(0, 0, rectWidth, _tableHeaderSVGHeight, props ); // Background RECT
			//rect.onmouseover = function(e) { this.setAttributeNS( null, 'stroke', _settings.tableHeaderActiveBorderColor); };
			//rect.onmouseout = function(e) { this.setAttributeNS( null, 'stroke', _settings.tableHeaderBorderColor); };
			let title = _data.table[col].name;
			if( isEditable( _data.table[col].ref ) ) {
				title += "*";
			}
			
			// TEXT
			let text = createForeignObjectWithText( title, 1, 0, rectWidth-2, _tableHeaderSVGHeight, 
				{ id:'tableHeaderColumnNameText'+col, textAlign:'center', fontSize:_settings.tableMaxFontSize, color:_settings.tableHeaderFontColor } );

			svg.appendChild( rect );			
			svg.appendChild( text );
			_tableHeaderSVG.appendChild( svg );
			
			if( !_touchDevice) {
				svg.addEventListener( 'mousedown', onTableHeaderMouseDown );
			} else { 
				;//svg.addEventListener( 'touchstart', onTableHeaderTouchStart ); 
			}
			svg.style.cursor = 'hand';
			svg.dataset.columnNumber = col;
		}

		// SPLITTERS
		left = 0;
		for( let col = 0 ; col < _data.table.length ; col++ ) {
			left += _data.table[col].width;

			let splitter = createRect( left-_settings.tableHeaderColumnHMargin, 0, _settings.tableHeaderColumnHMargin*2, _tableHeaderSVGHeight, 
				{ id:'tableSplitter'+col, fill:_settings.tableHeaderColumnSplitterColor } );
			splitter.dataset.columnNumber = col;
			if( !_touchDevice ) {
				splitter.setAttributeNS(null,'cursor','col-resize');
				splitter.addEventListener( 'mousedown', onTableColumnSplitterMouseDown );
			} else {
				;//splitter.addEventListener( 'touchstart', onTableColumnSplitterMouseDown );
			}
			_tableHeaderSVG.appendChild(splitter);
		}

	} else {
		document.getElementById('tableHeaderBkgr').setAttributeNS(null,'width',_tableHeaderOverallWidth);
		let left = 0;
		for( let col = 0 ; col < _data.table.length ; col++ ) {
			if( col > 0 ) {
				let rectWidth = _data.table[col].width - _settings.tableHeaderColumnHMargin * 2;
				let svg = document.getElementById('tableHeaderColumnNameSVG'+col);
				svg.setAttributeNS(null, 'x', left + _settings.tableHeaderColumnHMargin);
				svg.setAttributeNS(null, 'width', rectWidth);			
				let rect = document.getElementById('tableHeaderColumnNameBkgr'+col);
				rect.setAttributeNS(null, 'width', rectWidth);			
				let text = document.getElementById('tableHeaderColumnNameText'+col);
				text.setAttributeNS(null, 'width', rectWidth-2);							
			}
			left += _data.table[col].width;			
			let splitter = document.getElementById('tableSplitter'+col); 
			splitter.setAttributeNS(null,'x',left-_settings.tableHeaderColumnHMargin);
		}
	}
}


function drawTableContent( init=false, shiftOnly=false ) {

	if( _redrawAllMode ) { 		// If optimization is required to cope with a huge number of operations... 
		init=true;				// ..."init" if always true and...
		shiftOnly=false;		// ...as well no shifting.
	} 

    _tableViewBoxTop = Math.round( operToScreen( _visibleTop ) );
    let tcViewBox = `${_tableViewBoxLeft} ${_tableViewBoxTop} ${_tableContentSVGWidth} ${_tableContentSVGHeight}`;
    _tableContentSVG.setAttributeNS(null,'viewBox',tcViewBox);
    if( shiftOnly ) {
        return;
    }  
       _notHiddenOperationsLength
	// PREVIOUS CODE SNIPPET: let overallHeight = operToScreen( _data.operations.length );
	let overallHeight = operToScreen( _notHiddenOperationsLength );
	// console.log(`_notHiddenOperationsLength=${_notHiddenOperationsLength}, overallHeight=${overallHeight}`);
	if( init ) {
		while (_tableContentSVG.hasChildNodes()) {
			_tableContentSVG.removeChild(_tableContentSVG.lastChild);
		}

		_tableContentSVGBkgr = createRect( 0, 0, _tableHeaderOverallWidth, overallHeight, 
			{ stroke:'none', strokeWidth:1,  fill:_settings.tableContentFillColor } ); 	// backgroud rect
		_tableContentSVG.appendChild( _tableContentSVGBkgr );		
		
		let left = 0;
		for( let col = 0 ; col < _data.table.length ; col++ ) { // Creating svg-containers for columns
			let rectX = left + _settings.tableColumnHMargin;
			let rectWidth = _data.table[col].width - _settings.tableColumnHMargin * 2;
			let rect = createSVG( rectX, 0, rectWidth, overallHeight, 
				{ id:('tableColumnSVG'+col), fill:_settings.tableContentStrokeColor } );
			_tableContentSVG.appendChild( rect );
			left += _data.table[col].width;
		}
	} else {
		_tableContentSVGBkgr.setAttributeNS(null,'width',_tableHeaderOverallWidth);
		_tableContentSVGBkgr.setAttributeNS(null,'height',overallHeight);
		let left = 0;
		for( let col = 0 ; col < _data.table.length ; col++ ) { // Updating svg-containers for columns as well as splitters 
			let rectX = left + _settings.tableColumnHMargin;
			let rectWidth = _data.table[col].width - _settings.tableColumnHMargin * 2;
			let rect = document.getElementById('tableColumnSVG'+col);
			rect.setAttributeNS(null,'x',rectX);
			rect.setAttributeNS(null,'width',rectWidth);
			left += _data.table[col].width;			
			rect.setAttributeNS(null,'height',overallHeight);			
		}
	}

	// Doing fields inside columns
	let rectCounter = 0;
	let rectHeight = (operToScreen(1) - operToScreen(0));
	let fontSize = (rectHeight < 16) ? parseInt(rectHeight * 0.75) : _settings.tableMaxFontSize;
	let circleR = parseInt(3*fontSize/7);
	for( let i = 0 ; i < _data.operations.length ; i++ ) {

		if( _redrawAllMode ) {
			if( !_data.operations[i].visible ) {
				continue;
			}
			let hiddenTop = (rectCounter+2) < _visibleTop;
			let hiddenBottom = (rectCounter-1) > (_visibleTop + _visibleHeight); 
			if( hiddenTop || hiddenBottom  ) {
				rectCounter += 1;
				continue;
			}
		}

		let lineTop = operToScreen(rectCounter);
		let lineBottom = lineTop + rectHeight;
		let lineHeight = lineBottom - lineTop;
		let lineMiddle = lineBottom - lineHeight/2;
		let lineId = 'ganttTableLine' + i;

		// Expand functionality [+] / [-]
		let expand='';
		if( _data.operations[i].expandable ) {
			if( _data.operations[i].expanded ) {
				expand='▼'; // ▼
 			} else {
				expand= '►'; // ▶				
			}
		}
		let expandText;
		let expandTextId = 'tableColumn0Row' + i;

		if( init ) {			
			expandText = createText( expand, _data.table[0].width/2.0, lineMiddle, 
				{ id:expandTextId, fontSize:fontSize, textAnchor:'middle', alignmentBaseline:'baseline' } );
	 		document.getElementById('tableColumnSVG0').appendChild(expandText);
	 		expandText.dataset.operationNumber=i;
	 		if( _data.operations[i].expandable ) {
	 			expandText.style.cursor = 'pointer';
		 		expandText.onmousedown = function(e) {
		 			let operationNumber = Number(this.dataset.operationNumber); 
		 			if( _data.operations[operationNumber].expanded == true ) {
		 				for( let iO = 0 ; iO < _data.operations.length ; iO++ ) {
		 					for( let iP = 0 ; iP < _data.operations[iO].parents.length ; iP++ ) {
		 	 					if( _data.operations[iO].parents[iP] == operationNumber ) {
			 						_data.operations[iO].visible = false;
			 						break;
			 					}
			 				}
			 			}
		 				_data.operations[operationNumber].expanded = false;
		 			} else {
		 				for( let iO = operationNumber+1 ; iO < _data.operations.length ; iO++ ) {
		 					for( let iP = 0 ; iP < _data.operations[iO].parents.length ; iP++ ) {
		 						let iParent = _data.operations[iO].parents[iP];
		 	 					if( iParent == operationNumber ) {
			 						_data.operations[iO].visible = true;
			 						break;
			 					}
			 					if( _data.operations[iParent].expandable && _data.operations[iParent].expanded == false ) {
			 						break;
			 					}

			 				}
			 			}
		 				_data.operations[operationNumber].expanded = true;
		 			}
					setVisibleTopAndHeightAfterExpand();
		 			drawTableContent();
					drawGantt(true);
					displayYZoomFactor();
					drawVerticalScroll();
		 		};
		 	}
			if( fontSize >= _settings.tableMinFontSize ) { // If font size is too small to make text visible at screen.
				expandText.setAttributeNS(null,'display','block');
			} else {
				expandText.setAttributeNS(null,'display','none');				
			}

		 	// Fields inside columns
			let left = _data.table[0].width;
			for( let col = 1 ; col < _data.table.length ; col++ ) {
				let ref = _data.table[col].ref;
				let content = _data.operations[i][ref];
				let editedByUser = false;
				let color = _data.operations[i].colorFont; // _settings.tableContentStrokeColor;
				let fontStyle = null;
				let fontWeight = null;
				if( typeof(content) === 'undefined' ) {
					content = '';
				} else if( content === null ) {
					content = '';
				}

				if( ref === "Level" ) { // To display no 'teams' or 'assignments' (phases only). 
					if( typeof(content) === 'string' ) {
						content = "";
					}
				}

				let columnWidthToUse = _data.table[col].width - _settings.tableColumnHMargin*2;

				let tableColumnSVG = document.getElementById('tableColumnSVG'+col);
				let bkgr = createRect( 0, lineTop, columnWidthToUse, rectHeight,  
					{ id:('tableColumn'+col+'Row'+i+'Bkgr'), fill:_data.operations[i].colorBack } );
				tableColumnSVG.appendChild( bkgr );

				let textX = _settings.tableColumnTextMargin;
				let textProperties = { id:('tableColumn'+col+'Row'+i), fill:color, textAnchor:'start', 
					fontSize:fontSize, fontStyle:fontStyle, fontWeight:fontWeight, alignmentBaseline:'middle' };
				if( ref === 'Name' ) { // A name should be adjusted according to it position in the hierarchy
					// textX += _settings.hierarchyIndent * _data.operations[i].parents.length;
					content = spacesToPadNameAccordingToHierarchy(_data.operations[i].parents.length) + content; 
					if( typeof(_data.operations[i].Level) === 'number' ) { // If it is a phase...
						textProperties.fontWeight = 'bold'; // ... making it bold.
					}
				} else {
					if( _data.table[col].type === 'float' || _data.table[col].type === 'int' ) {
						content = formatNumberStringForTable( content, _data.table[col].type, _data.table[col].format );
						textX = columnWidthToUse - _settings.tableColumnTextMargin*2;
						textProperties.textAnchor = 'end';
					} else if( _data.table[col].type === 'string' || _data.table[col].type === 'text' ) { // For strings "format" stands for alignment
						if( _data.table[col].format == 1 ) { // Align right
							textX = columnWidthToUse - _settings.tableColumnTextMargin*2;
							textProperties.textAnchor = 'end';							
						} else if ( _data.table[col].format == 2 ) {
							textX = parseInt( (columnWidthToUse - _settings.tableColumnTextMargin) / 2 );
							textProperties.textAnchor = 'middle';														
						}
					} else if( _data.table[col].type === 'datetime' ) {
						if( !(_data.table[col].format > 0) ) { // Date only
							//let pattern = / +[0-9]{2}[\:\.][0-9]{2} *$/; 
							let pattern = new RegExp(' +[0-9]{2}' + _timeDelim + '[0-9]{2} *$'); 
							if( pattern.test(content) ) {               // If time is as well found in the string...
								content = content.replace(pattern, ''); // ... deleting it.
							}
						} else {  // Date and time should be specified...
							// let pattern = /^ *[0-9]{2}\.[0-9]{2}\.[0-9]{4} *$/;
							let pattern = new RegExp('^ *[0-9]{2}' + _dateDelim + '[0-9]{2}' + _dateDelim + '[0-9]{4} *$');
							if( pattern.test(content) ) {  // ... if not ... 
								content += ' 00' + _timeDelim + '00';       // ... adding time.
							}
						}
					} else if( _data.table[col].type === 'signal' ) { // Signals require being 'centered'
						textX = parseInt( (columnWidthToUse - _settings.tableColumnTextMargin) / 2 );
						textProperties.fill = decColorToString( content, _settings.ganttCriticalColor );;
						textProperties.stroke = _settings.tableContentStrokeColor;						
					}
				}
				let text;
				if( _data.table[col].type !== 'signal' ) {
					text = createText( content, textX, lineMiddle, textProperties );
				} else {
					text = createCircle( textX, lineMiddle, circleR, textProperties );					
				}
				tableColumnSVG.appendChild( text );
				if( fontSize >= _settings.tableMinFontSize ) { // If font size is too small to make text visible at screen.
					text.setAttributeNS(null,'display','block');
				} else {
					text.setAttributeNS(null,'display','none');				
				}
				let editableType = isEditable(_data.table[col].ref); // To confirm the field is editable...
				// If it is editable and it is neither team nor assignment...
				if( editableType != null ) {
					bkgr.style.cursor = 'pointer';
					bkgr.setAttributeNS( null, 'data-i', i );
					bkgr.setAttributeNS( null, 'data-col', col );
					bkgr.setAttributeNS( null, 'data-type', editableType );
					bkgr.onmousedown = onTableFieldMouseDown;
					text.style.cursor = 'pointer';
					text.setAttributeNS( null, 'data-i', i );
					text.setAttributeNS( null, 'data-col', col );
					text.setAttributeNS( null, 'data-type', editableType );
					text.onmousedown = onTableFieldMouseDown;
				} else {
					text.setAttribute('cursor','default');
				}
			}
		} else {
			expandText = document.getElementById(expandTextId);
			if( fontSize >= _settings.tableMinFontSize ) { // If font size is big enough to make text visible at screen.
				expandText.setAttributeNS(null,'x',_data.table[0].width/2.0);
				expandText.setAttributeNS(null,'y',lineMiddle);
				expandText.firstChild.nodeValue = expand;
				expandText.style.fontSize = fontSize;
				expandText.setAttributeNS(null,'display','block');				
			} else {
				expandText.setAttributeNS(null,'display','none');
			}

			let left = _data.table[0].width;
			for( let col = 1 ; col < _data.table.length ; col++ ) {
				let columnWidthToUse = _data.table[col].width - _settings.tableColumnHMargin*2;

				let textId = 'tableColumn'+col+'Row'+i;
				let textEl = document.getElementById(textId);
				if( fontSize >= _settings.tableMinFontSize ) { // If font size is big enough to make text visible at screen.
					if( _data.table[col].type !== 'signal' ) {
						textEl.setAttributeNS(null,'y',lineMiddle);
						textEl.style.fontSize = fontSize;
						if( _data.table[col].type == 'float' || _data.table[col].type == 'int' ) {
							textEl.setAttributeNS( null, 'x', columnWidthToUse - _settings.tableColumnTextMargin*2 );
						} else if( _data.table[col].type == 'string' || _data.table[col].type == 'text' ) { // For strings "format" stands for alignment
							if( _data.table[col].format == 1 ) { // Align right
								textEl.setAttributeNS( null, 'x', columnWidthToUse - _settings.tableColumnTextMargin*2 );
							} else if ( _data.table[col].format == 2 ) {
								textEl.setAttributeNS( null, 'x', parseInt( (columnWidthToUse - _settings.tableColumnTextMargin) / 2 ) );
							}
						}
					} else {
						textEl.setAttributeNS( null, 'cx', parseInt( (columnWidthToUse - _settings.tableColumnTextMargin) / 2 ) );
						textEl.setAttributeNS(null,'cy',lineMiddle);
						textEl.setAttributeNS( null, 'r', circleR );						
					}
					textEl.setAttributeNS(null,'display','block');				
				} else {
					textEl.setAttributeNS(null,'display','none');					
				}
				let bkgrEl = document.getElementById(textId+'Bkgr');
				bkgrEl.setAttributeNS(null,'y',lineTop);
				bkgrEl.setAttributeNS(null,'width',columnWidthToUse);
				bkgrEl.setAttributeNS(null,'height',rectHeight);
			}
		}

		if( _data.operations[i].visible && expandText.style.display == 'none' && (fontSize >= _settings.tableMinFontSize) ) {
			for( let col = 0 ; col < _data.table.length ; col++ ) {
				let id = 'tableColumn'+col+'Row'+i;
				let el = document.getElementById(id);
				el.setAttributeNS(null,'display','block');
			}
		} else if( (!_data.operations[i].visible && expandText.style.display != 'none') || (fontSize < _settings.tableMinFontSize) ) {
			for( let col = 0 ; col < _data.table.length ; col++ ) {
				let id = 'tableColumn'+col+'Row'+i;
				let el = document.getElementById(id);
				el.setAttributeNS(null,'display','none');
			}
		}		
		if( _data.operations[i].visible ) {
			rectCounter += 1;
		}				
	}
}


function onTableFieldMouseDown(e) {

	let col = this.getAttributeNS(null,'data-col');
	if( e.which == 3 || _touchDevice || true ) { // The right button has been clicked or a touch device is used...
		displayEditBoxWithData( this );
	} 
}


function drawTableScroll( init=false ) {
	let maxViewBoxLeft = (_tableHeaderOverallWidth > _tableScrollSVGWidth) ? (_tableHeaderOverallWidth - _tableScrollSVGWidth) : 0;
	let sliderSize = (maxViewBoxLeft > 0) ? (_tableScrollSVGWidth*_tableScrollSVGWidth/_tableHeaderOverallWidth) : _tableScrollSVGWidth;
	if( sliderSize < _settings.scrollSliderSize ) {
		sliderSize = _settings.scrollSliderSize;
	}

	let sliderX;
	if( maxViewBoxLeft > 0 ) {
		let maxSlider = _tableScrollSVGWidth - sliderSize;
		sliderX = _tableViewBoxLeft * maxSlider / maxViewBoxLeft;
		if( sliderX < 0 ) {
			sliderX = 0;
		} else if( sliderX > maxSlider ) {
			sliderX = maxSlider;
		}
	} else {
		sliderX = 0;
	}

	if( init ) {
		let bbox = _tableScrollSVG.getBBox();
		_tableScrollSVGBkgr = createRect( 0, 0, _tableScrollSVGWidth, _tableScrollSVGHeight, 
			{ id:('tableScrollSVGBkgr'), fill:_settings.scrollBkgrColor, stroke:_settings.scrollRectColor, strokeWidth:1 } );
		_tableScrollSVGBkgr.setAttributeNS(null,'cursor','pointer');
		_tableScrollSVGBkgr.onmousedown = onTableScrollSVGBkgr;
		_tableScrollSVGSlider = createRect( sliderX, 0, sliderSize, _tableScrollSVGHeight, 
			{ id:('tableScrollSVGSlider'), fill:_settings.scrollSliderColor } );
		_tableScrollSVGSlider.setAttributeNS(null,'cursor','pointer');
		_tableScrollSVG.appendChild( _tableScrollSVGBkgr );
		_tableScrollSVG.appendChild( _tableScrollSVGSlider );
		if( !_touchDevice ) {
			_tableScrollSVGSlider.addEventListener( 'mouseover', 
				function(e) { this.setAttributeNS(null,'fill',_settings.scrollSliderActiveColor); } );
			_tableScrollSVGSlider.addEventListener( 'mouseout', 
				function(e) { this.setAttributeNS(null,'fill',_settings.scrollSliderColor); } );
			_tableScrollSVGSlider.addEventListener( 'mousedown', onTableScrollSVGSliderMouseDown );
		} else {
			_tableScrollSVGSlider.addEventListener( 'touchstart', onTableScrollSVGSliderTouchStart );
			_tableScrollSVGSlider.addEventListener( 'touchmove', onTableScrollSVGSliderTouchMove );
			_tableScrollSVGSlider.addEventListener( 'touchend', onTableScrollSVGSliderTouchEnd );
			_tableScrollSVGSlider.addEventListener( 'touchcancel', onTableScrollSVGSliderTouchEnd );
		}
	} else {
		_tableScrollSVGBkgr.setAttributeNS(null,'width',_tableScrollSVGWidth);
		_tableScrollSVGSlider.setAttributeNS(null,'width',sliderSize);
		_tableScrollSVGSlider.setAttributeNS( null,'x', sliderX );
	}
}
