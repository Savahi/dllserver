function ifSynchronizedCheck() {
	let xmlhttpSynchro = new XMLHttpRequest();

	xmlhttpSynchro.onreadystatechange = function() {
	    if (this.readyState == 4 ) {
	    	if( this.status == 200 ) {
				if( this.responseText == '1' ) { 	// Synchronized
					_dataSynchronized = 1;
        		} else if( this.responseText == '0' ) { 	// Not synchronized
					_dataSynchronized = 0;
				} else {  	// Not authorized (the session has expired...)
					window.location.href = "/login.html";
				}
			} else {
				_dataSynchronized = -1;
			}
			displaySynchronizedStatus();
	    } 
	};
	let requestUrl = _requests.check_synchro + ((window.location.search.length > 0) ? (window.location.search) : ''); 
	xmlhttpSynchro.open( 'GET', requestUrl, true );
	xmlhttpSynchro.send();
}


function displaySynchronizedStatus() {
	let container = document.getElementById('headerControlsSynchronizedDiv');
	let icon = document.getElementById('headerControlsSynchronizedIcon');

	let scheduleNextCheck = true;
	if( !('editables' in _data) ) {
		icon.setAttribute('src',_iconSynchronizationUnapplied); // _iconEmpty
		container.title = _texts[_lang].synchronizationUnappliedMessage;
	} else {
		if( _data.editables.length == 0 ) {
			icon.setAttribute('src',_iconSynchronizationUnapplied); // _iconEmpty
			container.title = _texts[_lang].synchronizationUnappliedMessage;
		}
		else if( _dataSynchronized == -1 || _dataSynchronized == 0 ) {
			icon.setAttribute('src', _iconNotSynchronized);
			container.title = _texts[_lang].unsynchronizedMessage;
			if( _dataSynchronized == 0 ) {
				displayConfirmationBox( _texts[_lang].askForSynchronizationMessage, function() { loadData(); } );
				scheduleNextCheck = false;
			} 
		} else {
			icon.setAttribute('src',_iconSynchronized); // _iconEmpty	
			container.title = _texts[_lang].synchronizedMessage;
		}
	}
	if(scheduleNextCheck)
		setTimeout( ifSynchronizedCheck, _synchronizationRate );
} 
