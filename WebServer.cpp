//#include "Stdafx.h"
//#pragma hdrstop

// SampleApp.cpp

//#include <stdio.h>
//#include <windows.h>
#include <string>
//#include <iostream>
//#include <thread>
//#include "Globals.hpp"
#include <iostream>
#include "windows.h"
#include "WebServer.hpp"
//#include "test.h"

//#pragma comment(lib, "user32.lib")

//typedef int (*TEST_DLL_TEST)(void);
//TEST_DLL_TEST ptest;

static SERVER_DLL_START p_server_start;

using namespace std;

char _callback_error_code;
#define RESPONSE_BUFFER 100000
char _callback_response[RESPONSE_BUFFER+1];

int callback ( ServerData *sd ) {

  if( sd->message_id == SERVER_NOTIFICATION_MESSAGE ) { // Simply to inform SP about smth.
    printf("********\n%s\n", sd->message);
    return 0;
  } else {
	printf("********\nA MESSAGE FROM SERVER TO SP:\n");
    printf("ID: %d\n", sd->message_id);
	if( sd->user != nullptr ) {	
    	printf("USER: %s\n", sd->user);
	} else {
    	printf("USER: nullptr\n");
	}
	if( sd->message != nullptr ) {	
    	printf("MESSAGE: %s\n", sd->message);
	}
  }

  _callback_error_code = 0;
  sd->sp_response_buf = _callback_response;
  sd->sp_free_response_buf = false;

  if( sd->message_id == SERVER_GET_CONTENTS ) {
    strcpy( sd->sp_response_buf,
      "{ \"gantt\":[{\"id\":1,\"title\":\"Project #1\"}, {\"id\":2,\"title\":\"Project #2\"}], \"input\":[{\"id\":1,\"title\":\"Project #1\"}, {\"id\":2,\"title\":\"Project #2\"}], \"dashboard\":[{\"id\":1,\"title\":\"Project #1\"}, {\"id\":2,\"title\":\"Project #2\"}] }" );
    sd->sp_response_buf_size = strlen(sd->sp_response_buf);
    _callback_error_code = 0;
  }
  else if( sd->message_id == SERVER_CHECK_GANTT_SYNCHRO ) {
    strcpy( sd->sp_response_buf, "1" );   // "1" - synchronized, "0" - not sync., must reload
    sd->sp_response_buf_size = strlen(sd->sp_response_buf);
    _callback_error_code = 0;
  }
  else if( sd->message_id == SERVER_GET_GANTT ) {
    strcpy( sd->sp_response_buf, "tempdata/gantt.json" );
    sd->sp_response_buf_size = strlen(sd->sp_response_buf);
    _callback_error_code = 0;
  }
  else if( sd->message_id == SERVER_SAVE_GANTT ) {
    // "0" - saved ok, no error, "1" - saved ok, must reload, "10", "11", "12" etc - not saved
    cerr << "SAVE GANTT: " << endl << sd->message << endl;
    strcpy( sd->sp_response_buf, "{\"errorCode\":0, \"errorMessage\":\"Ok\"}" );
    sd->sp_response_buf_size = strlen(sd->sp_response_buf);
    _callback_error_code = 0;
  }
  else if( sd->message_id == SERVER_CHECK_INPUT_SYNCHRO ) {
    strcpy( sd->sp_response_buf, "1" );   // "1" - synchronized, "0" - not sync., must reload
    sd->sp_response_buf_size = strlen(sd->sp_response_buf);
    _callback_error_code = 0;
  }
  else if( sd->message_id == SERVER_GET_INPUT ) {
    strcpy( sd->sp_response_buf, "tempdata/input.json" );
    sd->sp_response_buf_size = strlen(sd->sp_response_buf);
    _callback_error_code = 0;
  }
  else if( sd->message_id == SERVER_SAVE_INPUT ) {
    // "0" - saved ok, no error, "1" - saved ok, must reload, "10", "11", "12" etc - not saved
    cerr << "SAVE INPUT: " << endl << sd->message << endl;
    strcpy( sd->sp_response_buf, "{\"errorCode\":0, \"errorMessage\":\"Ok\"}" );
    sd->sp_response_buf_size = strlen(sd->sp_response_buf);
    _callback_error_code = 0;
  }
  else if( sd->message_id == SERVER_SAVE_IMAGE ) {
    strcpy( sd->sp_response_buf, "{\"errorCode\":0, \"errorMessage\":\"Ok\"}" );
    sd->sp_response_buf_size = strlen(sd->sp_response_buf);
    _callback_error_code = 0;
  }
  else if( sd->message_id == SERVER_GET_IMAGE ) {
    // "0" - saved ok, no error, "1" - saved ok, must reload, "10", "11", "12" etc - not saved
    cerr << "SERVING A FILE: " << endl << sd->message << endl;

    FILE *fileptr = fopen("main\\image.jpg", "rb");
    size_t filesize=0;
    size_t blocksread=0;
    if( fileptr ) {
      fseek(fileptr, 0L, SEEK_END);
      filesize = ftell(fileptr);
      if( filesize <= RESPONSE_BUFFER ) {
        fseek(fileptr, 0L, SEEK_SET);
        blocksread = fread( sd->sp_response_buf, filesize, 1, fileptr);
      }
      fclose(fileptr);
    }
    if( blocksread == 1 ) {
      sd->sp_response_buf_size = filesize;
      _callback_error_code = 0;
    } else {
      sd->sp_response_buf[0] = '\x0';
      sd->sp_response_buf_size = 0;
      _callback_error_code = -1;
    }
  }
  else {
    sd->sp_response_buf[0] = '\x0';
    sd->sp_response_buf_size = 0;
    _callback_error_code = -1;
  }
  return _callback_error_code;
}

//#include <mutex>
//std::mutex mtx;

//int main(int argc, char **argv )
//static int message=0;

static char* users_and_passwords [] = { "admin", "admin", 0};
char* MPath = "C:\\Users\\lgirs\\Desktop\\papa\\spider\\server\\dll";
static StartServerData Data;

//void StartWebServer (int argc, char** argv)
int main (int argc, char** argv)
{
  HINSTANCE hServerDLL;

  Data.IP = "127.0.0.1";
  Data.Port = "8000";
  Data.UsersPasswords = users_and_passwords;
  Data.ExePath = MPath;
  Data.Message = 0;


  /*
  char *default_ip = "127.0.0.1";
  char *ip;
  if (argc > 1) {
    ip = argv[1];
  } else {
    ip = default_ip;
  }
  char *default_port = "8000";
  char *port;
  if (argc > 2) {
    port = argv[2];
  } else {
    port = default_port;
  }
  */

  hServerDLL = LoadLibrary ("server");
  if (hServerDLL != NULL)
  {
    p_server_start = (SERVER_DLL_START) GetProcAddress (hServerDLL, "start");

    if (p_server_start != NULL) {
      //int (*callback_ptr)(ServerData *) = callback;
      //cerr << "Server is about to start!" << endl;

      //p_server_start (ip, port, users_and_passwords, callback_ptr, &message);
      p_server_start (&Data, callback);

      cerr << "The server has started! Press <CTRL-C> to stop the server..."  << endl;
      string s;
      cin >> s;
      //message = 100;
    } else {
      //cerr << "The server has not started!" << endl;
    }
       FreeLibrary(hServerDLL);
  }
   //return 0;
}
