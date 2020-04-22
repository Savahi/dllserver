#ifndef WEBSERVER_H
#define WEBSERVER_H

// message_id
#define SERVER_NOTIFICATION_MESSAGE -1

#define SERVER_GET_CONTENTS 10 // get list of actions

#define SERVER_GET_GANTT 100
#define SERVER_CHECK_GANTT_SYNCHRO 110 // question whether gantt changed (bool)
#define SERVER_SAVE_GANTT 150          // comments received from WEB

#define SERVER_GET_INPUT 200
#define SERVER_CHECK_INPUT_SYNCHRO 210
#define SERVER_SAVE_INPUT 250

#define SERVER_SAVE_IMAGE 300
#define SERVER_GET_IMAGE 310

struct ServerData {
  char *user;         // User name
  int message_id;       // An id of the message sent TO the SP.
  char *message;        // The text of the message sent TO the SP.
  int message_size;

  char *sp_response_buf;    // SP response
  size_t sp_response_buf_size;   // SP might return the size of the response,
  bool sp_free_response_buf;    // SP might ask the server to free the memory allocated for it's response,
  bool sp_response_file;
  
  ServerData() {
	  sp_response_file = false;
  }
};

struct StartServerData {
  char* IP;
  char* Port;
  char** UsersPasswords;
  char* ExePath;
  int Message;
};

typedef int (*callback_ptr) (ServerData*);
typedef int (*SERVER_DLL_START) (StartServerData* data, callback_ptr callback);

//typedef int (*SERVER_DLL_START) (char *, char*, char **, int (*callback_ptr) (ServerData*), int* message);

#ifdef SERVER_DLL_EXPORT
  //extern "C" __declspec(dllexport) int start( char *, char *, char **, int (*callback)(ServerData *), int *message);
  extern "C" __declspec(dllexport) int start (StartServerData* data, callback_ptr callback);
#else
  //extern "C" __declspec(dllimport) int start( char *, char *, char **, int (*callback)(ServerData *), int *message);
  extern "C" __declspec(dllimport) int start (StartServerData* data, callback_ptr callback);
#endif

/*
"callback" is used to receive messages from server:

"message" is used to send messages to server:
  0 - no message, 100 - shutdow the server and terminate the thread
*/

#endif
