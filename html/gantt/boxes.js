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
		let promptDiv = document.createElement('div');
		promptDiv.id = 'editBoxInputPrompt' + ref;
		promptDiv.innerText = _data.editables[iE].name; // _texts[_lang][ref];
		promptDiv.className = 'editBoxPrompt';

		let input;
		if( _data.editables[iE].type == 'text' ) {
			input = document.createElement('textarea');
			input.rows = 4;
		} else {
			input = document.createElement('input');			
			input.setAttribute('type', 'text');
		}
		input.className = 'editBoxInput';
		input.id = 'editBoxInput' + ref;
		input.onblur = function(e) { // To make sure data entered are valid...
			let v = validateEditField( input, _data.editables[iE].type );
			if( !v.ok ) {
				document.getElementById('editBoxMessage').innerText = v.message;
				input.focus();				
			}
		};

		if( _data.editables[iE].type == 'datetime' ) {
			let calendarContainer = document.createElement('div');
			calendarContainer.style.marginBottom = '4px';
			let callCalendar = document.createElement('div');
			callCalendar.style.float = 'left';
			callCalendar.style.cursor = 'pointer';
			callCalendar.appendChild( document.createTextNode('☷') );
			callCalendar.onclick = function(e) { callCalendarForEditBox(input, calendarContainer, iE); }
			container.appendChild(callCalendar);
			container.appendChild(promptDiv);
			container.appendChild(input);		
			container.appendChild(calendarContainer);
		} else {
			container.appendChild(promptDiv);
			container.appendChild(input);		
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
		calendar( container, updateEditBoxWithCalendarChoice, 20, 20, d.date, _texts[_lang].monthNames );
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
			elem.value = _data.operations[i][ ref ];
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

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
	    if (this.readyState == 4 ) {
	    	if( this.status == 200 ) {
				let responseObj; 
			    let errorParsingResponseObj = false;
			    try {
					responseObj = JSON.parse(this.responseText);
			    } catch(e) {
			    	errorParsingResponseObj = true;
			    }
			    if( errorParsingResponseObj ) { // To ensure data are parsed ok... // alert(this.responseText);
		        	document.getElementById('editBoxMessage').innerText = _texts[_lang].errorParsingData;
					return;
			    }
		        if( responseObj.errorCode == 0 ) { 	// Data saved Ok, no reload required...
		        	let i = _editBoxOperationIndex;
					for( let iE = 0 ; iE < _data.editables.length ; iE++ ) { // For all editable fields in the table...
						let ref = _data.editables[iE].ref;
						let elem = document.getElementById( 'editBoxInput' + ref ); // ... retrieving the element that stores a new value.
						_data.operations[i][ ref ] = elem.value;
						for( let col = 0 ; col < _data.table.length ; col++ ) { // Changing the value in the table...
							if( _data.table[col].ref == ref ) {
								writeNewValueFromInputElemIntoTable( elem.value, i, col, ref );								
								break;
							}
						}
					}
			        document.getElementById('ganttGroupTitle'+i).textContent = formatTitleTextContent(i); // Refresh summary text on the operation...
			        hideEditBox();
					ifSynchronizedCheck();
		        } else if( responseObj.errorCode == 1 ) { 	// Data saved Ok, reload required...
			        hideEditBox();
		        	loadData();
				} else {
		        	document.getElementById('editBoxMessage').innerText = _texts[_lang].errorLoadingData + ": " + this.responseObj.errorMessage;
		        }
		    }
	    }
	};

	let bEdited = false; // The following is to confirm something has been edited...
	for( let iE = 0 ; iE < _data.editables.length ; iE++ ) {
		let ref = _data.editables[iE].ref;
		let elem = document.getElementById( 'editBoxInput' + ref );
		if( elem ) {
			if( elem.value != _data.operations[_editBoxOperationIndex][ref] ) {
				bEdited = true;
				break;
			}
		}
	}		
	if( !bEdited ) {
		hideEditBox();
		return;
	} 

	let userData = createUserDataObjectToSend(_editBoxOperationIndex);
//console.log(userData);
	xmlhttp.open("POST", _requests.save, true);
	xmlhttp.setRequestHeader("Cache-Control", "no-cache");
	//xmlhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');		
	//xmlhttp.setRequestHeader('Content-type', 'application/json');		
	//xmlhttp.setRequestHeader("Content-type", "plain/text" ); //"application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	//xmlhttp.send( "data=" + JSON.stringify(userData) );		
	xmlhttp.send( JSON.stringify(userData) );		
	//xmlhttp.send( JSON.stringify(userData) );		
	document.getElementById('editBoxMessage').innerText = _texts[_lang].waitSaveUserDataText; // Displaying the "wait" message. 
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
		let pattern = new RegExp("[^ \\:\\.\\-0-9\\\\]");
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
	return (!format.dateOnly) ? 1 : 0; 	// 1 - date and time, 0 - date only
}


function createUserDataObjectToSend( editedOperationIndex ) {
	let userData = {}; // Creating userData object with all the data entered but not synchronized

	let i = editedOperationIndex;
	//userData[ _settings.webExportLineNumberColumnName ] = i;
	userData[ 'Level' ] = _data.operations[i]['Level'];			
	for( let iE = 0 ; iE < _data.editables.length ; iE++ ) {
		let ref = _data.editables[iE].ref;
		let elem = document.getElementById( 'editBoxInput' + ref );
		let value = elem.value;
		userData[ ref ] = value;
	}
	userData["Code"] = _data.operations[i].Code;
	userData["__ProjCode"] = _data.proj.Code;
	userData["__ProjVer"] = _data.proj.ProjVer;
	userData["__LineNumber"] = i;
	userData["__UserName"] = _userName;
	userData["__WebApp"] = "gantt";
	return userData;
}


function writeNewValueFromInputElemIntoTable( inputElemValue, i, col, ref ) {
	let destElem = document.getElementById( 'tableColumn'+col+'Row'+i );

	let updated;
	if( _data.operations[i][ref] != inputElemValue ) {
		destElem.setAttributeNS( null, 'font-style', "italic" );
		destElem.setAttributeNS( null, 'font-weight', "bold" );
		updated = ''; //updated = '✎';
	} else { // If user re-entered the old value
		destElem.setAttributeNS( null, 'font-style', "normal" );										
		destElem.setAttributeNS( null, 'font-weight', "normal" );
		updated = '';
	}

	if( ref == 'Name') {
		let hrh = _data.operations[i].parents.length;
		destElem.childNodes[0].nodeValue = updated + spacesToPadNameAccordingToHierarchy(hrh) + inputElemValue;
	}
	else { // Shifting according to hierarchy if it is a name
		if( _data.table[col].type == 'float' ) {
			let valueToTrim = parseFloat(inputElemValue);
			if( !isNaN(valueToTrim) && typeof(_data.table[col].format) !== 'undefined' ) {
				inputElemValue = valueToTrim.toFixed(_data.table[col].format);
			}
		}
		destElem.childNodes[0].nodeValue = updated + inputElemValue;
	}
}