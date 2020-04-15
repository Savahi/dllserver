#pragma once

	#ifndef __AUTH_H
	#define __AUTH_H

	#define AUTH_SESS_ID_BUF_SIZE 100
	#define AUTH_USER_NAME_BUF_SIZE 40
	
	char *auth_do(char *b, char **users_and_passwords);
	char *auth_confirm(char *b, bool bUpdateSession=true);
	int auth_logout(char *b);

	char *auth_get_sess_id( void );
	char *auth_get_user_name( void );

	#endif
