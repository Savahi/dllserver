// drawgantt.js

function drawGantt( init=false, shiftOnly=false ) {
	if( _redrawAllMode ) { 		// If optimization is required to cope with a huge number of operations... 
		init=true; 				// ..."init" if always true and...
		shiftOnly=false;		// ...as well no shifting.
	}  
    
    _ganttViewBoxLeft = timeToScreen( _ganttVisibleLeft ) - _settings.ganttChartLeftMargin;
    _ganttViewBoxTop = operToScreen( _visibleTop );
    let ganttViewBox = `${_ganttViewBoxLeft} ${_ganttViewBoxTop} ${_ganttSVGWidth} ${_ganttSVGHeight}`;
    _ganttSVG.setAttributeNS(null,'viewBox',ganttViewBox);
    if( shiftOnly ) {
    	return;
    }

	if( init ) {
		let nodes = _ganttSVG.childNodes;
		for( let n = nodes.length-1 ; n >= 0  ; n-- ) {
			//if( nodes[n].id.indexOf('ganttBkgrGrid') == 0 ) { //
			// Optimizing nodes[n].id.indexOf('ganttBkgrGrid') == 0 
			if( nodes[n].id[5] == 'B' && nodes[n].id[8] == 'r' ) { 
				continue;
			}
			_ganttSVG.removeChild( nodes[n] );
		}
	}

	// Drawing gantt bkgr
	let ganttWidth = timeToScreen(_data.visibleMax) * (1.0 + _settings.ganttVisibleWidthExtra) / _settings.minXZoomFactor
	let ganttHeight = operToScreen(_data.operations.length);
	if( !_ganttSVGBkgr ) {
		_ganttSVGBkgr = createRect( 0, 0, ganttWidth, ganttHeight, { id:'ganttBkgr', fill:_settings.ganttBkgrColor } );
		_ganttSVG.appendChild(_ganttSVGBkgr);				
	} else {
		_ganttSVGBkgr.setAttributeNS( null, 'width', ganttWidth );
		_ganttSVGBkgr.setAttributeNS( null, 'height', ganttHeight );
	}
	
	let titleRight = (_titlesPositioning === 'r'); 

	// Calculating the coordinates...
	let fontSize;
	if( !titleRight ) {
		fontSize = (operToScreen(_settings.ganttRectTopMargin) - operToScreen(0)) * 0.75;			
	} else {
		fontSize = (operToScreen(1.0 - _settings.ganttRectBottomMarginTitleFree) - operToScreen(0)) * 0.75;					
	}
	if( fontSize > _settings.ganttMaxFontSize ) {
		fontSize = _settings.ganttMaxFontSize;
	}

	let noTitle = (fontSize < _settings.ganttMinFontSize);

	displayTitlesPositioning(null, noTitle);
	
	let rectBottomMargin, rectTopMargin, compareBottomMargin, compareTopMargin;
	if( !titleRight ) {
		rectBottomMargin = _settings.ganttRectBottomMargin;
		rectTopMargin = _settings.ganttRectTopMargin;
		compareBottomMargin = _settings.ganttCompareBottomMargin;
		compareTopMargin = _settings.ganttCompareTopMargin;
	} else {
		rectBottomMargin = _settings.ganttRectBottomMarginTitleFree;
		rectTopMargin = _settings.ganttRectTopMarginTitleFree;
		compareBottomMargin = _settings.ganttCompareBottomMarginTitleFree;
		compareTopMargin = _settings.ganttCompareTopMarginTitleFree;		
	}

	let rectCounter = 0;
	let operationHeight = operToScreen(1) - operToScreen(0);
	let rectHeight = operToScreen(1.0 - rectBottomMargin) - operToScreen(rectTopMargin);
	for( let i = 0 ; i < _data.operations.length ; i++ ) {
		if( !_data.operations[i].visible ) {
			_data.operations[i].onScreen = false;
			continue;
		}
		let hiddenLeft = false; //_data.operations[i].displayFinInSeconds < _ganttVisibleLeft;
		let hiddenRight = false; //_data.operations[i].displayStartInSeconds > _ganttVisibleLeft + _ganttVisibleWidth;
		let hiddenTop = (rectCounter+2) < _visibleTop;
		let hiddenBottom = (rectCounter-1) > (_visibleTop + _visibleHeight); 
		if( (hiddenLeft || hiddenRight) || (hiddenTop || hiddenBottom)  ) {
			_data.operations[i].onScreen = false;
			//if( _redrawAllMode ) {
				//rectCounter++;
				//continue;
			//}
		} else {
			_data.operations[i].onScreen = true;
		}

		_data.operations[i].left = timeToScreen( _data.operations[i].displayStartInSeconds );
		_data.operations[i].right = timeToScreen( _data.operations[i].displayFinInSeconds );
		_data.operations[i].top = operToScreen(rectCounter);
		_data.operations[i].bottom = _data.operations[i].top + operationHeight; // operToScreen(rectCounter + 1);
		_data.operations[i].rectTop = operToScreen(rectCounter + rectTopMargin);
		_data.operations[i].rectBottom = _data.operations[i].rectTop + rectHeight; // operToScreen(rectCounter + 1.0 - rectBottomMargin);
		let rectWidth = _data.operations[i].right - _data.operations[i].left;
		if( rectWidth < 3 && _data.operations[i].displayFinInSeconds > _data.operations[i].displayStartInSeconds ) {
			_data.operations[i].left -= 1;
			_data.operations[i].right += 1;
			_data.operations[i].width = 3;
		} else {
			_data.operations[i].width = rectWidth;
		}
		rectCounter++;
	}

	// Drawing gantt links...
	let lineProperties = { stroke:_settings.ganttLinkStrokeColor, strokeWidth:_settings.ganttLinkStrokeWidth, opacity:_settings.ganttLinkOpacity };
	let arrowLineProperties = { stroke:_settings.ganttLinkStrokeColor, strokeWidth:1, opacity:_settings.ganttLinkArrowOpacity, endingArrow:true };
	for( let i = 0 ; i < _data.links.length ; i++ ) {
		let predOp = _data.links[i].predOp;
		let succOp = _data.links[i].succOp;
		if( predOp === null || succOp === null ) {
			continue;
		}
		//console.log(`i = ${i}, predOp=${predOp}, succOp=${succOp}`);
		let atLeastOneOpOnScreen = (_data.operations[predOp].onScreen || _data.operations[succOp].onScreen)&&(_data.operations[predOp].visible && _data.operations[succOp].visible); 
		// let bothOpsAreVisible = _data.operations[predOp].visible && _data.operations[succOp].visible; // MAY BE DELETED!
		if( !atLeastOneOpOnScreen ) {
			continue;
		}
		let line, arrowLine, lineX1, lineY1, lineX2, lineY2, arrowY, lineArrowY;
		if( _data.links[i].TypeSF2 == 'SS' || _data.links[i].TypeSF2 == 'SF' ) {
			lineX1 = _data.operations[predOp].left;
		} else {
			lineX1 = _data.operations[predOp].right;				
		}
		if( _data.operations[predOp].top < _data.operations[succOp].top ) {
			lineY1 = _data.operations[predOp].rectBottom;
			lineY2 = _data.operations[succOp].rectTop - _settings.ganttLinkArrowHeight*2;
			arrowY = _data.operations[succOp].rectTop - _settings.ganttLinkArrowHeight;
		} else {
			lineY1 = _data.operations[predOp].rectTop;
			lineY2 = _data.operations[succOp].rectBottom + _settings.ganttLinkArrowHeight*2;
			arrowY = _data.operations[succOp].rectBottom + _settings.ganttLinkArrowHeight;
		}
		if( _data.links[i].TypeSF2 == 'SF' || _data.links[i].TypeSF2 == 'FF' ) {
			lineX2 = _data.operations[succOp].right;
		} else {
			lineX2 = _data.operations[succOp].left;				
		}

		if( init ) {
			lineProperties.id = 'ganttLine'+i;
			//console.log(`creating a line in a drawGantt: predOp=${predOp}, visible=${_data.operations[predOp].visible}, succOp=${succOp}, visible=${_data.operations[succOp].visible}`);
			//console.log(`creating a line in a drawGantt: predOp=${predOp}, onscr=${_data.operations[predOp].onScreen}, succOp=${succOp}, onscr=${_data.operations[succOp].onScreen}`);
			//console.log(`lineX1=${lineX1}, lineY1=${lineY1}, lineX2=${lineX2}, lineY2=${lineY2}`);
			line = createLine( lineX1, lineY1, lineX2, lineY2, lineProperties );
			arrowLineProperties.id = 'ganttLineArrow'+i;
			arrowLine = createLine( lineX2, lineY2, lineX2, arrowY, arrowLineProperties );
			_ganttSVG.appendChild(line);				
			_ganttSVG.appendChild(arrowLine);		
		} else {
			line = document.getElementById( 'ganttLine'+i );
			line.setAttributeNS(null,'x1',lineX1);
			line.setAttributeNS(null,'x2',lineX2);
			line.setAttributeNS(null,'y1',lineY1);
			line.setAttributeNS(null,'y2',lineY2);
			arrowLine = document.getElementById( 'ganttLineArrow'+i );
			arrowLine.setAttributeNS(null,'x1',lineX2);
			arrowLine.setAttributeNS(null,'x2',lineX2);
			arrowLine.setAttributeNS(null,'y1',lineY2);
			arrowLine.setAttributeNS(null,'y2',arrowY);
		}
		if( !_data.operations[predOp].visible || !_data.operations[succOp].visible || !_displayLinksOn ) {
			line.setAttributeNS(null,'display','none');
			arrowLine.setAttributeNS(null,'display','none');
		} else {				
			line.setAttributeNS(null,'display','block');				
			arrowLine.setAttributeNS(null,'display','block');				
		}
	}	

	// Drawing main gantt visual elements...
	let op0Properties = { fill:_settings.ganttOperation0Color, opacity:_settings.ganttOperation0Opacity };
	let op100Properties = { fill:_settings.ganttOperation100Color, opacity:_settings.ganttOperation100Opacity };
	let opCompareProperties = { fill:_settings.ganttCompareColor, opacity:_settings.ganttCompareOpacity };
	for( let i = 0 ; i < _data.operations.length ; i++ ) {
		if( !_data.operations[i].onScreen && !_data.operations[i].visible ) {
			continue;
		}		
		let rectStart = _data.operations[i].left;
		let rectEnd = _data.operations[i].right;
		let rectTop = _data.operations[i].rectTop;
		let rectBottom = _data.operations[i].rectBottom;
		let rectWidth = _data.operations[i].width;
		let displayCompare, displayCompareAsARhomb, rectCompareStart, rectCompareEnd, rectCompareTop, rectCompareBottom;
		if( _data.operations[i].Start_COMPInSeconds != -1 && _data.operations[i].Fin_COMPInSeconds != -1 ) {
			rectCompareStart = timeToScreen( _data.operations[i].Start_COMPInSeconds );
			rectCompareEnd = timeToScreen( _data.operations[i].Fin_COMPInSeconds );
			rectCompareTop = _data.operations[i].top + operationHeight * compareTopMargin;
			rectCompareBottom = _data.operations[i].bottom - operationHeight * compareBottomMargin;
			displayCompare = true;
			if( _data.operations[i].Fin_COMPInSeconds > _data.operations[i].Start_COMPInSeconds ) {
				displayCompareAsARhomb = false;
			} else {
				displayCompareAsARhomb = true;				
			}
		} else {
			displayCompare = false;
		}

		let textX, textY;
		if( !titleRight ) {
			textX = rectStart;
			textY = rectTop - 4;
		} else {
			let rhomb = false;
			if( _data.operations[i].status == 0 || _data.operations[i].status == 100 ) { // Not started or finished...
				; // rhomb = !(rectWidth > 0);				
			} else { // Started but not finished
				rhomb = (_data.operations[i].displayFinInSeconds == _data.operations[i].displayRestartInSeconds);
			}
			if( !rhomb ) { // It is not a rhomb
				textX = rectEnd + rectHeight/2 + 4;
			} else {
				textX = rectEnd + rectHeight/2 + 4;
			}
			textY = rectTop + fontSize;			
		}

		if( init ) { // Initializing...
			let group = document.createElementNS( NS, 'g' ); // Container
			group.setAttributeNS(null,'id','ganttGroup'+i);
			if( displayCompare ) { // To compare with...
				opCompareProperties.id = 'ganttOpCompare' + i;
				let rectCompare;
				if( !displayCompareAsARhomb ) { 	// Displaying compare rectangle
					rectCompare = createRect( rectCompareStart, rectCompareTop, rectCompareEnd - rectCompareStart, 
						rectCompareBottom - rectCompareTop, opCompareProperties ); // Compare rectangle
				} else {		// Diplaying compare as a rhomb
					rectCompare = createRhomb( rectCompareStart, rectCompareTop, rectHeight, opCompareProperties );
				}
				group.appendChild(rectCompare);
			}			

			if( _data.operations[i].status == 0 ) { // Not started
				let op0;
				op0Properties.id = 'ganttOpNotStarted'+i;
				// op0Properties.fill = (_data.operations[i].f_Critical=="1") ? _settings.ganttCriticalColor : _settings.ganttOperation0Color;
				op0Properties.fill = _data.operations[i].color;
				if( !(rectWidth > 0) ) {
					op0 = createRhomb( rectStart, rectTop, rectHeight, op0Properties );
				} else if( !_data.operations[i]._isPhase ) { // Not a phase ?
					op0 = createRect( rectStart, rectTop, rectWidth, rectHeight, op0Properties ); // Rectangle
				} else {
					op0 = createPolygon( calcPhaseCoords( rectStart, rectTop, rectWidth, rectHeight), op0Properties );
				}
				group.appendChild(op0);
			} else if( _data.operations[i].status == 100 ) { // Finished
				let op100;
				op100Properties.id = 'ganttOpFinished'+i;
				if( !(rectWidth > 0) ) {
					op100 = createRhomb( rectStart, rectTop, rectHeight, op100Properties );
				} else if( !_data.operations[i]._isPhase ) { // Not a phase
					op100 = createRect( rectStart, rectTop, rectWidth, rectHeight, op100Properties ); // Rectangle
				} else {
					op100 = createPolygon( calcPhaseCoords( rectStart, rectTop, rectWidth, rectHeight ), op100Properties );
				}
				group.appendChild(op100);
			} else { // Started but not finished
				let xLastFin = timeToScreen( _data.operations[i].lastFinInSeconds );
				let xRestart = timeToScreen( _data.operations[i].displayRestartInSeconds );
				op100Properties.id = 'ganttOpFinished'+i;
				let op100;
				let width100 = xLastFin - rectStart;
				if( !(width100 > 0) ) {
					op100 = createRhomb( rectStart, rectTop, rectHeight, op100Properties );
				} else if( !_data.operations[i]._isPhase ) { // Not a phase
					op100 = createRect( rectStart, rectTop, width100, rectHeight, op100Properties  ); // Rectangle
				} else {
					op100 = createPolygon( calcPhaseCoords(rectStart, rectTop, width100, rectHeight,-1), op100Properties );
				}
				group.appendChild(op100);

				if( xLastFin < xRestart ) { // A gap between 
					op100Properties.id = 'ganttOpBetweenFinishedAndNotStarted'+i;
					opBetween = createRect( xLastFin, rectTop+rectHeight*0.33, xRestart - xLastFin, 1 /*rectHeight*0.2*/, op100Properties  ); // Rectangle
					group.appendChild(opBetween);				
				} 
				
				op0Properties.id = 'ganttOpNotStarted'+i;
				op0Properties.fill = _data.operations[i].color;
				let op0;
				let width0 = rectEnd - xRestart;
				if( !(width0 > 0) ) {
					op0 = createRhomb( rectEnd, rectTop, rectHeight, op0Properties );
				} else if( !_data.operations[i]._isPhase ) { // Not a phase
					op0 = createRect( xRestart, rectTop, width0, rectHeight, op0Properties  ); // Rectangle
				} else {
					op0 = createPolygon( calcPhaseCoords(xRestart, rectTop, width0, rectHeight, 1), op0Properties );
				}
				group.appendChild(op0);
			}
			// group.onmouseover = function(e) { document.getElementById('tableColumn0Row'+i).setAttributeNS(null,'fill','#2f2f2f') };
			// let bkgr = createRect( 0, lineTop, _data.table[col].width, rectHeight, { id:('tableColumn'+col+'Row'+i+'Bkgr'), fill:_data.operations[i].colorBack } );

			let title = document.createElementNS( NS,'title' ); // Title
			title.setAttributeNS(null, 'id', 'ganttGroupTitle'+i);
			title.textContent = formatTitleTextContent(i);
			group.appendChild(title);

			group.setAttributeNS( null, 'data-i', i );
			if( !_data.noEditables ) {
	 			group.onmousedown = function(e) { e.stopPropagation(); displayEditBoxWithData(this); };
				group.style.cursor = 'pointer';
	 			//group.ontouchstart = function(e) { e.stopPropagation(); displayEditBoxWithData(this); };
			}

			text = createText( _data.operations[i].Name, textX, textY, // - fontSize * 0.25, 
				{ fontSize:fontSize, fill:_settings.ganttFontColor, id:'ganttText'+i, textAnchor:'left', alignmentBaseline:'baseline' } );
			if( !_data.noEditables ) {
				text.style.cursor = 'pointer';
			}
			group.appendChild(text);
			_ganttSVG.appendChild(group);			
		} else { // Not initializing but only updating coordinates...
			text = document.getElementById( 'ganttText'+i );
			text.setAttributeNS(null,'x',textX);
			text.setAttributeNS(null,'y',textY);
			text.style.fontSize = fontSize;
			if( displayCompare ) { 
				let el = document.getElementById('ganttOpCompare' + i);
				if( !displayCompareAsARhomb ) { 	// Not a rhomb
					setRectCoords( el, rectCompareStart, rectCompareTop, 
						rectCompareEnd - rectCompareStart, rectCompareBottom - rectCompareTop );
				} else {		// A rhomb
					el.setAttributeNS( null,'points', calcRhombCoords( rectCompareStart, rectCompareTop, rectHeight ) );
				}
			}
			if( _data.operations[i].status == 0 ) { // Not started
				let el = document.getElementById('ganttOpNotStarted'+i);
				if( !(rectWidth > 0) ) {
					el.setAttributeNS( null,'points', calcRhombCoords( rectStart, rectTop, rectHeight ) );
				} else if( !_data.operations[i]._isPhase ) { // Not a phase
					setRectCoords( el, rectStart, rectTop, rectWidth, rectHeight );
				} else {
					el.setAttributeNS( null,'points', calcPhaseCoords(rectStart, rectTop, rectWidth, rectHeight) );
				} 
			} else if( _data.operations[i].status == 100 ) {
				let el = document.getElementById('ganttOpFinished'+i);
				if( !(rectWidth > 0) ) {
					el.setAttributeNS( null,'points', calcRhombCoords( rectStart, rectTop, rectHeight ) );
				} else if( !_data.operations[i]._isPhase ) { // Not a phase
					setRectCoords( el, rectStart, rectTop, rectWidth, rectHeight );
				} else {
					el.setAttributeNS( null,'points', calcPhaseCoords(rectStart, rectTop, rectWidth, rectHeight) );
				} 
			} else {
				let xLastFin = timeToScreen( _data.operations[i].lastFinInSeconds );				
				let xRestart = timeToScreen( _data.operations[i].displayRestartInSeconds );
				let width100 = xLastFin - rectStart;
				let width0 = rectEnd - xRestart;
				let el100 = document.getElementById('ganttOpFinished'+i);
				let el0 = document.getElementById('ganttOpNotStarted'+i);
				if( !(width100 > 0) ) { // Zero width
					el100.setAttributeNS( null,'points', calcRhombCoords( rectStart, rectTop, rectHeight ) );					
				} else if( !_data.operations[i]._isPhase ) { // Not a phase
					setRectCoords( el100, rectStart, rectTop, width100, rectHeight );
				} else {
					el100.setAttributeNS( null,'points', calcPhaseCoords(rectStart, rectTop, width100, rectHeight,-1) );
				} 
				if( xLastFin < xRestart ) {
					let elBetween = document.getElementById( 'ganttOpBetweenFinishedAndNotStarted'+i );
					setRectCoords( elBetween, xLastFin, rectTop + rectHeight*0.33, xRestart - xLastFin, 1 /*rectHeight*0.2*/ );
				}
				if( !(width0 > 0) ) { // Zero width
					el0.setAttributeNS( null,'points', calcRhombCoords( rectEnd, rectTop, rectHeight ) );					
				}
				if( !_data.operations[i]._isPhase ) { // Not a phase
					setRectCoords( el0, xRestart, rectTop, width0, rectHeight );
				} else {
					el0.setAttributeNS( null,'points', calcPhaseCoords(xRestart, rectTop, width0, rectHeight,1) );
				} 
			}
		}

		if( noTitle ) { // If font size is too small to make text visible at screen.
			text.setAttributeNS(null,'display','none');
		} else {
			text.setAttributeNS(null,'display','block');				
		}

		let group = document.getElementById('ganttGroup'+i); // Hiding or showing the group.
		if( !_data.operations[i].visible ) {
			group.setAttributeNS(null,'display','none');
		} else {
			_data.operations[i].left = rectStart;
			_data.operations[i].right = rectEnd;
			_data.operations[i].top = rectTop;
			_data.operations[i].bottom = rectBottom;			
			group.setAttributeNS(null,'display','block');
		}
	}
}

function drawGanttHScroll( init=false ) {
	let extra = _ganttVisibleWidth * _settings.ganttVisibleWidthExtra;
	let overallWidth = getGanttMaxLeft() + _ganttVisibleWidth - _data.visibleMin; // _data.visibleMaxWidth + extra;
	let visibleMaxLeft;
	if(overallWidth > _ganttVisibleWidth) {
		visibleMaxLeft = getGanttMaxLeft(); // (_data.visibleMin + overallWidth - _ganttVisibleWidth);
	} else {
		 visibleMaxLeft = _data.visibleMin;
	}

	let sliderSize = (visibleMaxLeft > _data.visibleMin) ? (_ganttHScrollSVGWidth*_ganttVisibleWidth/overallWidth) : _ganttHScrollSVGWidth;
	if( sliderSize < _settings.scrollSliderSize ) {
		sliderSize = _settings.scrollSliderSize;
	}

	let sliderPosition;
	if( visibleMaxLeft > _data.visibleMin ) {
		sliderPosition = (_ganttVisibleLeft-_data.visibleMin) * (_ganttHScrollSVGWidth-sliderSize) / (visibleMaxLeft-_data.visibleMin);
	} else {
		sliderPosition = 0;
	}


	if( init ) {
		let bbox = _ganttHScrollSVG.getBBox();
		_ganttHScrollSVGBkgr = createRect( 0, 0, _ganttHScrollSVGWidth, _ganttHScrollSVGHeight, 
			{ id:('ganttHScrollSVGBkgr'), fill:_settings.scrollBkgrColor, stroke:_settings.scrollRectColor, strokeWidth:1 } );
		_ganttHScrollSVGBkgr.setAttributeNS(null,'cursor','pointer');
		_ganttHScrollSVGBkgr.addEventListener( 'mousedown', onGanttHScrollSVGBkgr );
		//_ganttHScrollSVGBkgr.addEventListener( 'touchstart', onGanttHScrollSVGBkgr );		
		_ganttHScrollSVGSlider = createRect( sliderPosition, 0, sliderSize, _ganttHScrollSVGHeight, 
			{ id:('ganttHScrollSVGSlider'), fill:_settings.scrollSliderColor } );
		_ganttHScrollSVGSlider.setAttributeNS(null,'cursor','pointer');
		_ganttHScrollSVG.appendChild( _ganttHScrollSVGBkgr );
		_ganttHScrollSVG.appendChild( _ganttHScrollSVGSlider );
		if( !_touchDevice ) {
			_ganttHScrollSVGSlider.addEventListener('mouseover', 
				function(e) { this.setAttributeNS(null,'fill',_settings.scrollSliderActiveColor); } );
			_ganttHScrollSVGSlider.addEventListener('mouseout',
				function(e) { this.setAttributeNS(null,'fill',_settings.scrollSliderColor); } );
			_ganttHScrollSVGSlider.addEventListener('mousedown', onGanttHScrollSVGSlider );
		} else {
			_ganttHScrollSVGSlider.addEventListener('touchstart', onGanttHScrollSVGSliderTouchStart );
			_ganttHScrollSVGSlider.addEventListener('touchmove', onGanttHScrollSVGSliderTouchMove );
			_ganttHScrollSVGSlider.addEventListener('touchend', onGanttHScrollSVGSliderTouchEnd );
			_ganttHScrollSVGSlider.addEventListener('touchcancel', onGanttHScrollSVGSliderTouchEnd );
		}
	} else {
		_ganttHScrollSVGBkgr.setAttributeNS(null,'width',_ganttHScrollSVGWidth);
		_ganttHScrollSVGSlider.setAttributeNS(null,'width',sliderSize);
		_ganttHScrollSVGSlider.setAttributeNS(null,'x',sliderPosition);
	}
}

function drawVerticalScroll( init ) {
	if( !init ) {
		init = false;
	}
	let overallHeight =  _notHiddenOperationsLength;
	let visibleMaxTop = (overallHeight > _visibleHeight) ? (overallHeight - _visibleHeight) : 0;
	let sliderSize = (visibleMaxTop > 0) ? (_verticalScrollSVGHeight*_visibleHeight/overallHeight) : _verticalScrollSVGHeight;
	if( sliderSize < _settings.scrollSliderSize ) {
		sliderSize = _settings.scrollSliderSize;
	}
	let sliderPosition;
	if( visibleMaxTop > 0 ) {
		sliderPosition = _visibleTop * (_verticalScrollSVGHeight-sliderSize) / visibleMaxTop;
	} else {
		sliderPosition = 0;
	}
	if( init ) {
		let bbox = _verticalScrollSVG.getBBox();
		_verticalScrollSVGBkgr = createRect( 0, 0, _verticalScrollSVGWidth, _verticalScrollSVGHeight, 
			{ id:('verticalScrollSVGBkgr'), fill:_settings.scrollBkgrColor, stroke:_settings.scrollRectColor, strokeWidth:1 } );
		_verticalScrollSVGBkgr.setAttributeNS(null,'cursor','pointer');
		_verticalScrollSVGBkgr.addEventListener('mousedown', onVerticalScrollSVGBkgr);
		//_verticalScrollSVGBkgr.addEventListener('touchstart', onVerticalScrollSVGBkgr);
		_verticalScrollSVGSlider = createRect( 0, sliderPosition, _verticalScrollSVGWidth, sliderSize, 
			{ id:('verticalScrollSVGSlider'), fill:_settings.scrollSliderColor } );
		_verticalScrollSVGSlider.setAttributeNS(null,'cursor','pointer');
		_verticalScrollSVG.appendChild( _verticalScrollSVGBkgr );
		_verticalScrollSVG.appendChild( _verticalScrollSVGSlider );
		if( !_touchDevice ) {
			_verticalScrollSVGSlider.addEventListener( 'mouseover', 
				function(e) { this.setAttributeNS(null,'fill',_settings.scrollSliderActiveColor); } );
			_verticalScrollSVGSlider.addEventListener( 'mouseout',
				function(e) { this.setAttributeNS(null,'fill',_settings.scrollSliderColor); } );
			_verticalScrollSVGSlider.addEventListener('mousedown', onVerticalScrollSVGSliderMouseDown, true );
		} else {
			_verticalScrollSVGSlider.addEventListener('touchstart', onVerticalScrollSVGSliderTouchStart );
			_verticalScrollSVGSlider.addEventListener('touchmove', onVerticalScrollSVGSliderTouchMove );
			_verticalScrollSVGSlider.addEventListener('touchend', onVerticalScrollSVGSliderTouchEnd );
			_verticalScrollSVGSlider.addEventListener('touchcancel', onVerticalScrollSVGSliderTouchEnd );
		}
	} else {
		_verticalScrollSVGSlider.setAttributeNS(null,'height',sliderSize);
		_verticalScrollSVGSlider.setAttributeNS(null,'y',sliderPosition);
	}
}

