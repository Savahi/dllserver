var	_blackOutBoxDiv=null;

var	_messageBoxDiv=null;
var	_messageBoxTextDiv=null;

var	_confirmationBoxDiv=null;
var	_confirmationBoxTextDiv=null;
var _confirmationBoxOk=null;
var _confirmationBoxCancel=null;

var	_editBoxDiv=null;
var	_editBoxDetailsElem=null;
var _editBoxDateFieldCurrentlyBeingEdited=null;


function displayConfirmationBox( message, okFunction=null ) {
	_blackOutBoxDiv = document.getElementById("blackOutBox");
	_confirmationBoxDiv = document.getElementById("confirmationBox");
	_confirmationBoxTextDiv = document.getElementById("confirmationBoxText");
	_confirmationBoxOk = document.getElementById("confirmationBoxOk");
	_confirmationBoxCancel = document.getElementById("confirmationBoxCancel");

	_blackOutBoxDiv.style.display='block';	
	_blackOutBoxDiv.onclick = hideConfirmationBox;
	_confirmationBoxDiv.style.display = 'table';
	_confirmationBoxTextDiv.innerHTML = message;
	if( okFunction === null ) {
		_confirmationBoxCancel.style.visibility = 'hidden';
		_confirmationBoxOk.onclick = hideConfirmationBox;
	} else {
		_confirmationBoxCancel.style.visibility = 'visible';
		_confirmationBoxCancel.onclick = hideConfirmationBox;
		_confirmationBoxOk.onclick = function() { hideConfirmationBox(); okFunction(); };
	}
}

function hideConfirmationBox() {
	_blackOutBoxDiv.style.display='none';	
	_blackOutBoxDiv.onclick = null;
	_confirmationBoxDiv.style.display = 'none';
}

function displayMessageBox( message ) {
	_blackOutBoxDiv = document.getElementById("blackOutBox");
	_messageBoxDiv = document.getElementById("messageBox");
	_messageBoxTextDiv = document.getElementById("messageBoxText");

	_blackOutBoxDiv.style.display='block';	
	_messageBoxDiv.style.display = 'table';
	_messageBoxTextDiv.innerHTML = message;
}

function hideMessageBox() {
	_blackOutBoxDiv.style.display='none';	
	_messageBoxDiv.style.display = 'none';
}

function displayEditBox() {
	_blackOutBoxDiv.style.display='block';	
	_editBoxDiv.style.display = 'table';
}
function hideEditBox() {
	_blackOutBoxDiv.style.display='none';	
	_editBoxDiv.style.display = 'none';
	document.getElementById('editBoxMessage').innerText = '';			
	calendarCancel();
}


function validateEditFieldAndFocusIfFailed(input, type) { // To make sure data entered are valid...
	let v = validateEditField( input, type );
	if( !v.ok ) {
		document.getElementById('editBoxMessage').innerText = v.message;
		input.focus();				
		return false;
	}
	return true;
}


function createEditBoxInputs() {
	_blackOutBoxDiv = document.getElementById("blackOutBox");
	_editBoxDiv = document.getElementById('editBox');			
	_editBoxDetailsElem = document.getElementById('editBoxDetails');			

	let container = document.getElementById('editBoxInputs');
	if( !container ) {
		return;
	}
	container.style.height = '100%';
	for( let iE = 0 ; iE < _data.editables.length ; iE++ ) {
		let ref = _data.editables[iE].ref;

		let inputContainerDiv = document.createElement('div'); // To hold an input and the prompt
		inputContainerDiv.className = 'editBoxInputContainer';

		let promptDiv = document.createElement('div');	// The prompt
		promptDiv.id = 'editBoxInputPrompt' + ref;	
		promptDiv.innerText = _data.editables[iE].name; // _texts[_lang][ref];
		promptDiv.className = 'editBoxPromptDiv';

		let inputDiv = document.createElement('div');	// A div to hold the input (and prossibly calendar calling button)
		inputDiv.className = 'editBoxInputDiv';

		let input;	// The input to type smth. in
		if( _data.editables[iE].type == 'text' ) {
			input = document.createElement('textarea');
			input.rows = 4;
		} else {
			input = document.createElement('input');			
			input.setAttribute('type', 'text');
		}
		input.id = 'editBoxInput' + ref;
		input.onfocus = function(e) { _editBoxDateFieldCurrentlyBeingEdited = this; };
		input.onblur = function(e) { validateEditFieldAndFocusIfFailed( this, _data.editables[iE].type ); };

		if( _data.editables[iE].type == 'datetime' ) {	// A DateTime field requires a calendar 
			input.className = 'editBoxInputDateTime'; 
			let calendarContainer = document.createElement('div');
			calendarContainer.className = 'editBoxInputContainer';
			let callCalendar = document.createElement('div');
			callCalendar.className = 'editBoxInputCallCalendar'
			callCalendar.appendChild( document.createTextNode('☷') );
			callCalendar.onclick = function(e) { callCalendarForEditBox(input, calendarContainer, iE); }
			inputDiv.appendChild(input);
			inputDiv.appendChild(callCalendar);
			inputDiv.appendChild(calendarContainer);
			inputContainerDiv.appendChild(promptDiv);
			inputContainerDiv.appendChild(inputDiv);		
			container.appendChild(inputContainerDiv);
		} else {
			input.className = 'editBoxInput';
			inputDiv.appendChild(input);
			inputContainerDiv.appendChild(promptDiv);
			inputContainerDiv.appendChild(inputDiv);		
			container.appendChild(inputContainerDiv);
		}
	}

	_editBoxDiv.addEventListener( "keyup", onEditBoxKey );
	window.addEventListener( "keyup", onEditBoxKey );
}

function onEditBoxKey(event) {
	if( _editBoxDiv.style.display !== 'none' ) {
		event.preventDefault();
		if( event.keyCode == 27 ) {
			hideEditBox();
		}			
	}
}


function callCalendarForEditBox( input, container, indexInEditables ) {
	let d = parseDate( input.value );
	if( d !== null ) {
		_editBoxDateFieldCurrentlyBeingEdited = input;
		setCalendarFormat( _data.editables[indexInEditables].format );	// '1' - date and time, '0' - date only
		calendar( container, updateEditBoxWithCalendarChoice, 24, 24, d.date, _texts[_lang].monthNames );
	}
}

function updateEditBoxWithCalendarChoice(d) {
	if( d !== null ) {
		let flag;
		if( getCalendarFormat() == 0 ) { // Date only
			flag = true;
		} else {
			flag = false;
		}
		_editBoxDateFieldCurrentlyBeingEdited.value = dateIntoSpiderDateString( d, flag );
		_editBoxDateFieldCurrentlyBeingEdited.onblur(null);
	}
}


var _editBoxOperationIndex = -1;

// Displaying data related to an operation in the edit box 
function displayEditBoxWithData( id ) {
	let i = id.getAttributeNS(null, 'data-i');
	_editBoxDetailsElem.innerHTML = formatTitleTextContent(i,true);
	_editBoxOperationIndex = i;
	for( let iE = 0 ; iE < _data.editables.length ; iE++ ) { // For every editable field...
		let ref = _data.editables[iE].ref;
		let elem = document.getElementById( "editBoxInput" + ref ); // An element to input new value into
		if( elem ) {
			let valueToSet = _data.operations[i][ ref ];
			if( valueToSet !== null ) {
				if( _data.refSettings[ref].type === 'datetime' ) {
					valueToSet = adjustDateTimeToFullFormat( valueToSet );
				}
				elem.value = valueToSet;
			}				

			if( ref === 'Start' || ref === 'Fin' ) { // If this is a "Start" or "Fin" field changed, recalculation of several other ones is required...
				elem.onblur = function(e) {
					if( !validateEditFieldAndFocusIfFailed( this, 'datetime') ) {
						return;
					}
					if( validateStartAndFinDates() == 0 ) {
						return;
					}

					let isItStart = (this.id === 'editBoxInputStart') ? true : false;

					let volAndDur = recalculateVolAndDurAfterStartOrFinChanged( this.value, _editBoxOperationIndex, isItStart, true );
					if( volAndDur.volDone !== null ) {
						let elemVolDone = document.getElementById( 'editBoxInputVolDone');
						if( elemVolDone ) {
							elemVolDone.value = volAndDur.volDone;
						}
					}
					if( volAndDur.volRest !== null ) { // volRest
						let elemVolRest = document.getElementById( 'editBoxInputVolRest');
						if( elemVolRest ) {
							elemVolRest.value = volAndDur.volRest;
						}
					}
					if( volAndDur.durRest !== null ) { // durRest
						let elemDurRest = document.getElementById( 'editBoxInputDurRest');
						if( elemDurRest ) {
							elemDurRest.value = volAndDur.durRest;
						}
					}
					if( volAndDur.durDone !== null ) { // durDone
						let elemDurDone = document.getElementById( 'editBoxInputDurDone');
						if( elemDurDone ) {
							elemDurDone.value = volAndDur.durDone;
						}
					}
				}
			}
			else if( ref === 'VolDone' ) { // If this is a "VolDone" field changed, recalculation of "VolRest" is required...
				elem.onblur = function(e) {
					if( !validateEditFieldAndFocusIfFailed( this, 'float') ) {
						return;
					}
					let volRestAndDur = recalculateVolAndDurAfterVolDoneChanged( this.value, _editBoxOperationIndex, true );					
					if( volRestAndDur.volRest !== null ) { // '0' stands for volRest
						let elemVolRest = document.getElementById( 'editBoxInputVolRest');
						if( elemVolRest ) {
							elemVolRest.value = volRestAndDur.volRest;
						}
					}
					if( volRestAndDur.durRest !== null ) { // '1' stands for durRest
						let elemDurRest = document.getElementById( 'editBoxInputDurRest');
						if( elemDurRest ) {
							elemDurRest.value = volRestAndDur.durRest;
						}
					}
					if( volRestAndDur.durDone !== null ) { // '2' stands for durDone
						let elemDurDone = document.getElementById( 'editBoxInputDurDone');
						if( elemDurDone ) {
							elemDurDone.value = volRestAndDur.durDone;
						}
					}
				}
			}
			else if( ref === 'DurDone' ) { // If this is a "DurDone" field changed, recalculation of "DurRest" is required...
				elem.onblur = function(e) {
					if( !validateEditFieldAndFocusIfFailed( this, 'float') ) {
						return;
					}					
					let durRest = recalculateDurRestAfterDurDoneChanged( this.value, _editBoxOperationIndex, true );				
					if( durRest !== null ) {
						let elemDurRest = document.getElementById( 'editBoxInputDurRest');
						if( elemDurRest ) {
							elemDurRest.value = durRest;
						}
					}
				}
			}			
		}
	}
	displayEditBox();
}


function saveUserDataFromEditBox() {
	// Validating all the data are entered correctly...
	for( let iE = 0 ; iE < _data.editables.length ; iE++ ) {
		let ref = _data.editables[iE].ref;
		let input = document.getElementById('editBoxInput' + ref);
		let v = validateEditField( input, _data.editables[iE].type );
		if( !v.ok ) {
			document.getElementById('editBoxMessage').innerText = v.message;
			input.focus();				
			return; // If invalid data found - nothing happens...
		}
	}
	if( validateStartAndFinDates() == 0 ) {
		return;
	}

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
	    if (this.readyState == 4 ) {
	    	if( this.status == 200 ) {
			    let errorParsingData = false;
				let response = null;
			    try{
					response = JSON.parse(this.responseText);
			    } catch(e) {
			    	response = null;
			    }
		        if( response === null ) {
		        	document.getElementById('editBoxMessage').innerText = _texts[_lang].errorSavingData;
		        	return;
				}
				if( response.errorCode != 0 ) {
		        	document.getElementById('editBoxMessage').innerText = response.errorMessage;
		        	return;
				}

	        	let i = _editBoxOperationIndex;
				for( let iE = 0 ; iE < _data.editables.length ; iE++ ) { // For all editable fields in the table...
					let ref = _data.editables[iE].ref;
					let elem = document.getElementById( 'editBoxInput' + ref ); // ... retrieving the element that stores a new value.
					writeNewValueFromInputElemIntoTable( elem.value, i, ref );								
					_data.operations[i][ ref ] = elem.value; // Reading the value (possibly) changed.
				}
		        hideEditBox();
				ifSynchronizedCheck();
		    }
	    }
	};

	if( !isEditBoxInputsChanged() ) {
		hideEditBox();
		return;
	} 

	let userData = createUserDataObjectToSendAfterEditingInBox(_editBoxOperationIndex);
	if( userData ) {
		xmlhttp.open("POST", _requests.save, true);
		xmlhttp.setRequestHeader("Cache-Control", "no-cache");
		xmlhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');		
		//xmlhttp.setRequestHeader('Content-type', 'application/json');		
		//xmlhttp.setRequestHeader("Content-type", "plain/text" ); //"application/x-www-form-urlencoded");
		xmlhttp.send( userData );		
		document.getElementById('editBoxMessage').innerText = _texts[_lang].waitSaveUserDataText; // Displaying the "wait" message. 
	}
}


function isEditBoxInputsChanged() {
	let bChanged = false;

	for( let iE = 0 ; iE < _data.editables.length ; iE++ ) {
		let ref = _data.editables[iE].ref;
		let elem = document.getElementById( 'editBoxInput' + ref );
		if( elem ) {
			if( elem.value != _data.operations[_editBoxOperationIndex][ref] ) {
				bChanged = true;
				break;
			}
		}
	}		
	return bChanged;
}


function validateStartAndFinDates() {
	let startDate=null, finDate=null;

	let elStartDate = document.getElementById('editBoxInputStart');
	let elFinDate = document.getElementById('editBoxInputFin');
	if( !elStartDate || !elFinDate ) {
		return -1;
	}

	startDate = parseDate( elStartDate.value );
	finDate = parseDate( elFinDate.value ); 

	if( startDate === null || finDate === null ) {
		if( _editBoxDateFieldCurrentlyBeingEdited ) { 
			_editBoxDateFieldCurrentlyBeingEdited.focus();
		}
		return 0;
	}
	let startY = startDate.date.getYear()+1900;
	let finY = finDate.date.getYear()+1900;
	if( startY < 1900 || startY > 2500 || finY < 1900 || finY > 2500 || (startDate.timeInSeconds > finDate.timeInSeconds) ) {
		if( _editBoxDateFieldCurrentlyBeingEdited ) { 
			_editBoxDateFieldCurrentlyBeingEdited.focus();
		}
		return 0;						
	}	

	return 1;
}					



function validateEditField( input, type, allowedEmpty=true ) {
	let r = { ok:false, message:'ERROR!' };

	let value = input.value;

	if( allowedEmpty ) {
		let pattern = new RegExp("[^ ]");
		if( !pattern.test(value) ) {
			r.ok = true;
			r.message = 'EMPTY';
			return r;
		}
	}

	if( type === 'datetime' ) {
		let pattern = new RegExp("[^ \\/\\:\\.\\-0-9\\\\]");
    	let illegalCharacters = pattern.test(value);
    	if( illegalCharacters ) { 
    		r.message = _texts[_lang].datetimeError;
    		return r;
    	}		
		let d = parseDate(value);
		if( d == null ) {
    		r.message = _texts[_lang].datetimeError;
			return r;
		}
	} else if( type === 'int' ) {
		let pattern = new RegExp("[^ 0-9]");
    	let illegalCharacters = pattern.test(value);
    	if( illegalCharacters ) { 
    		r.message = _texts[_lang].intError;    		
    		return r;
    	}		
    	if( isNaN( parseInt(value) ) ) {
    		r.message = _texts[_lang].intError;    		
    		return r;
    	}
	} else if( type === 'float' ) {
		let pattern = new RegExp("[^ \\.0-9]");
    	let illegalCharacters = pattern.test(value);
    	if( illegalCharacters ) { 
    		r.message = _texts[_lang].floatError;    		
    		return r;
    	}		
    	if( isNaN( parseFloat(value) ) ) {
    		r.message = _texts[_lang].floatError;    		
    		return r;
    	}
	}
	r.ok = true;
	r.message = 'Ok';
	return r;
}

function setCalendarFormat( format ) {
	if( !( format > 0) ) { // For dates the "format" specifies if time required (1) or not (0) 
		calendarSetFormat( {'dateOnly':true} );
	} else {
		calendarSetFormat( {'dateOnly':false} );				
	}			
}

function getCalendarFormat() {
	let format = calendarGetFormat(); 
	if( 'dateOnly' in format ) { 	// Should not happen, but...
		return 1;
	}
	return (!format.dateOnly) ? 1 : 0; 	// '1' - date and time, '0' - date only
}


function createUserDataObjectToSendAfterEditingInBox( i ) {
    let formData = new FormData();

	let userData = {};
	userData[ 'Level' ] = _data.operations[i]['Level'];			
	for( let iE = 0 ; iE < _data.editables.length ; iE++ ) {
		let ref = _data.editables[iE].ref;
		let elem = document.getElementById( 'editBoxInput' + ref );
		let value = elem.value;
		userData[ ref ] = value; //console.log(JSON.stringify(userData));
	}

	userData["Code"] = _data.operations[i].Code;
	userData["__ProjCode"] = _data.proj.Code;
	userData["__ProjVer"] = _data.proj.ProjVer;
	userData["__LineNumber"] = i;
	userData["__ParentOperation"] = searchParentOperationIfAssignmentOrTeam(i);
	userData["__UserName"] = _userName;
	userData["__WebApp"] = "input";
	return userData;
}


function searchParentOperationIfAssignmentOrTeam(i) {
	let parentOperation='';
	if( _data.operations[i].Level == 'A' ) { 	// It is an assignment - searching for parent
		if( _data.operations[i].parents.length > 0 ) {
			let parentIndex = _data.operations[i].parents[0];
			if( _data.operations[parentIndex].Level === null ) { 	// It is an operation
				parentOperation = _data.operations[parentIndex].Code;
			} else if( _data.operations[parentIndex].Level == 'T' ) { 	// It is a team
				if( _data.operations[i].parents.length > 1 ) {
					let parentOfParentIndex = _data.operations[i].parents[1];
					if( _dataOperations[parentOfParentIndex].Level === null ) { // It is an operation
						parentOperation = _data.operations[parentOrParentIndex].Code;
					}
				}	
			}				
		}
	} else if( _data.operations[i].Level == 'T' ) { 	// It is a team - searching for parent
		if( _data.operations[i].parents.length > 0 ) {
			let parentIndex = _data.operations[i].parents[0];
			if( _data.operations[parentIndex].Level === null ) { 	// It is an operation
				parentOperation = _data.operations[parentIndex].Code;
			}
		}
	}
	return parentOperation;
}


function calculateSecondsInIntervalWithCalendar( start, end, i ) {
	let endLessStart = end - start;
	if( !( 'Calen' in _data.operations[i] ) ) {
		return endLessStart;
	}
	let calendarRef = _data.operations[i].Calen;
	if( !( calendarRef in _data.proj.Calendars ) ) {
		return endLessStart;
	}
	let referencedCalendar = _data.proj.Calendars[calendarRef];
	if( referencedCalendar === 'undefined' ) {
		return endLessStart;
	}
	if( referencedCalendar === null ) {
		return endLessStart;
	}
	let overlaps = 0;
	for( let i = 0 ; i < referencedCalendar.length ; i += 2 ) {
		cstart = referencedCalendar[i];
		cend = referencedCalendar[i+1];
		if( cstart >= end || cend <= start ) {
			continue;
		}
		if( cstart > start ) {
			if( cend >= end ) {
				overlaps += end - cstart;
			} else {				
				overlaps += cend - cstart;
			}
		} else if( cend < end ) {
			if( cstart >= start ) {
				overlaps += cend - cstart;
			} else {
				overlaps += cend - start;
			}
		} else {
			overlaps = endLessStart;
			break;
		}
	}
	return overlaps;
}

function recalculateVolAndDurAfterStartOrFinChanged( newDate, i, isItStart, isItEditBox=false ) {
	let r = { 'volDone':null, 'volRest':null, 'durDone':null, 'durRest':null };

	let newDateParsed = parseDate( newDate );
	if( newDateParsed === null ) {
		return r;
	}
	let newDateInSeconds = newDateParsed.timeInSeconds;

	let startDateInSeconds=Number.NaN, finDateInSeconds=Number.NaN;
	if( 'Start' in _data.operations[i] && 'Fin' in _data.operations[i] ) 
	{
		let startDateParsed = parseDate( _data.operations[i].Start );
		if( startDateParsed !== null ) {		
			startDateInSeconds = startDateParsed.timeInSeconds;
			let finDateParsed = parseDate( _data.operations[i].Fin );
			if( finDateParsed !== null ) {
				finDateInSeconds = finDateParsed.timeInSeconds;
			}
		}
	}
	if( isNaN(startDateInSeconds) || isNaN(finDateInSeconds) ) {
		return r;
	}

	let oldInterval = calculateSecondsInIntervalWithCalendar( startDateInSeconds, finDateInSeconds, i );
	if( !(oldInterval > 0.0) ) {
		return r;
	}

	let newInterval = -1.0;
	if( !isItEditBox ) {
		if( isItStart ) {
			newInterval = calculateSecondsInIntervalWithCalendar( newDateInSeconds, finDateInSeconds, i );							
		} else {
			newInterval = calculateSecondsInIntervalWithCalendar( startDateInSeconds, newDateInSeconds, i );
		}			
	} else {
		let startDateParsedInSeconds = -1;
		let finDateParsedInSeconds = -1;
		let elemStart = document.getElementById( 'editBoxInputStart' );
		if( elemStart ) {
			let startDateParsed = parseDate( elemStart.value );
			if( startDateParsed !== null ) {		
				startDateParsedInSeconds = startDateParsed.timeInSeconds;
			}
		} else {
			if( 'Start' in _data.operations[i] ) {
				let startDateParsed = parseDate( _data.operations[i].Start );
				if( startDateParsed !== null ) {		
					startDateParsedInSeconds = startDateParsed.timeInSeconds;
				}
			}
		}
		let elemFin = document.getElementById( 'editBoxInputFin' );
		if( elemFin ) {
			let finDateParsed = parseDate( elemFin.value );
			if( finDateParsed !== null ) {		
				finDateParsedInSeconds = finDateParsed.timeInSeconds;
			}
		} else {
			if( 'Fin' in _data.operations[i] ) {			
				let finDateParsed = parseDate( _data.operations[i].Fin );
				if( finDateParsed !== null ) {		
					finDateParsedInSeconds = finDateParsed.timeInSeconds;
				}
			}
		}
		if( !(startDateParsedInSeconds < 0.0) && !(finDateParsedInSeconds < 0.0) ) {
			newInterval = calculateSecondsInIntervalWithCalendar( startDateParsedInSeconds, finDateParsedInSeconds, i );
		}
	}
	if( newInterval < 0.0 ) {
		return r;
	}
	
	let changeRatio = newInterval / oldInterval;

	let oldVolDone = Number.NaN;
	if( 'VolDone' in _data.operations[i] ) {
		oldVolDone = parseFloat( _data.operations[i].VolDone );
	}
	if( isNaN(oldVolDone) ) {
		return r;
	}

	r.volDone = oldVolDone * changeRatio;
	let volAndDur = recalculateVolAndDurAfterVolDoneChanged( r.volDone, i, isItEditBox );
	r.volRest = volAndDur.volRest;
	r.durRest = volAndDur.durRest;
	r.durDone = volAndDur.durDone;					
	//console.log('Recalculated: ' + JSON.stringify(r));
	return r;
}


function recalculateVolAndDurAfterVolDoneChanged( volDoneEntered, i, isItEditBox=false ) {
	let r = { 'volRest':null, 'durRest':null, 'durDone':null };

	let volPlan = Number.NaN;
	if( isItEditBox ) {
		let elemVolPlan = document.getElementById('editBoxInputVolPlan');
		if( elemVolPlan ) {
			volPlan = parseFloat( elemVolPlan.value );
		}
	}
	if( isNaN(volPlan) ) {
		if( 'VolPlan' in _data.operations[i] ) {
			volPlan = parseFloat( _data.operations[i]['VolPlan'] );
		}
	}
	if( isNaN(volPlan) ) {
		return r;
	}	
	let volDone = parseFloat( volDoneEntered );
	if( isNaN(volDone) ) {
		return r;
	}
	let donePlanRatio = ( volPlan > 0.0 ) ? (volDone / volPlan) : 1.0;
	
	r.volRest = volPlan - volDone;
	if( r.volRest < 0 ) {
		r.volRest = 0;
	}

	let teamDur = Number.NaN;
	if( isItEditBox ) {
		let elemTeamDur = document.getElementById('editBoxInputTeamDur');
		if( elemTeamDur ) {
			teamDur = parseFloat( elemTeamDur.value );
		} 
	}
	if( isNaN(teamDur) ) {			
		if( 'TeamDur' in _data.operations[i] ) {
			teamDur = parseFloat( _data.operations[i]['TeamDur'] );
		}
	} 
	if( isNaN(teamDur) ) {
		return r;
	}

	r.durDone = donePlanRatio * teamDur;
	r.durRest = recalculateDurRestAfterDurDoneChanged( r.durDone, i, isItEditBox );
	return r;
}


function recalculateDurRestAfterDurDoneChanged( durDoneEntered, i, isItEditBox=false ) {
	let teamDur=Number.NaN;

	if( isItEditBox ) {
		let elemTeamDur = document.getElementById('editBoxInputTeamDur');
		if( elemTeamDur ) {
			teamDur = parseFloat( elemTeamDur.value );
		}
	}
	if( isNaN(teamDur) ) {
		if( 'TeamDur' in _data.operations[i] ) {
			teamDur = parseFloat( _data.operations[i]['TeamDur'] );
		}
	} 
	if( isNaN(teamDur) ) {
		return null;
	}

	let durDone = parseFloat( durDoneEntered );
	if( isNaN(durDone) ) {
		return null;
	}

	let durRest = teamDur - durDone;
	if( durRest < 0 ) {
		durRest = 0;
	}
	return durRest;
} 


function formatTitleTextContent( i, html=false ) {
	let textContent = "";
	let endl = ( !html ) ? "\r\n" : "<br/>";

	let opName = _data.operations[i].Name;
	if( html ) {
		opName = "<b><font size='+1'>" + opName + "</font></b>" + endl;
	} else {
		opName = opName + endl;
	}
	let opCode = _data.operations[i].Code;
	if( html ) {
		opCode = "<b>" + opCode + "</b>" + endl;
	} else {
		opCode = opCode + endl + "---------------------------------------" + endl;
	}
	textContent = opName + opCode;

	for( let col=1 ; col < _data.table.length ; col++ ) {
		if( 'visible' in _data.table[col] ) {
			if( !_data.table[col].visible )
				continue;
		}		
		if( _data.table[col].ref === 'Name' ) {
			continue;
		}
		if( _data.table[col].ref === 'Code' ) {
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
		if( content === 'undefined' || content === null || content === '' ) {
			content = '&#8230;';
		}
		if( html ) {
			textContent += "<div>" + name + ": " + content + "</div>";
		} else {
			textContent += name + ": " + content + endl;
		}
	}	
	return textContent;
}