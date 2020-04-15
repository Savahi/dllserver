#ifndef SERVER_H
#define SERVER_H

#define SERVER_GET_CONTENTS 10

#define SERVER_GET_GANTT 100
#define SERVER_CHECK_GANTT_SYNCHRO 110
#define SERVER_SAVE_GANTT 150

#define SERVER_GET_INPUT 200
#define SERVER_CHECK_INPUT_SYNCHRO 110
#define SERVER_SAVE_INPUT 250

#define SERVER_SAVE_IMAGE 300
#define SERVER_GET_IMAGE 310

struct ServerData {
	char *user; 				// User name
	int message_id; 			// An id of the message sent TO the SP.
	char *message;				// The text of the message sent TO the SP.
	int message_size;   		

	char *sp_response_buf;		// SP response 
	size_t sp_response_buf_size; 	// SP might return the size of the response, 
	bool sp_free_response_buf;		// SP might ask the server to free the memory allocated for it's response,
};

typedef int (*SERVER_DLL_START)(char *, char*, char **, int (*callback_ptr)(ServerData *), int *message);

#ifdef SERVER_DLL_EXPORT
	extern "C" __declspec(dllexport) int start( char *, char *, char **, int (*callback)(ServerData *), int *message);
#else
	extern "C" __declspec(dllimport) int start( char *, char *, char **, int (*callback)(ServerData *), int *message);
#endif

/*
"callback" is used to receive messages from server:

"message" is used to send messages to server:
	0 - no message, 100 - shutdow the server and terminate the thread
*/

#endif
