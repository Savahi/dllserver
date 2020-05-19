#pragma once

#ifndef __HELPERS_H
#define __HELPERS_H

#define MIME_BUF_SIZE 80
void set_mime_type(char *fn, char *mime_buf, int mime_buf_size);

int get_uri_to_serve(char *b, char *uri_buf, int uri_buf_size, bool *is_get, char *get_buf, int get_buf_size, char **post, bool *is_options);

int get_user_and_session_from_cookie( char *b, char *user_buf, int user_buf_size, char *sess_id_buf, int sess_id_buf_size  );

int get_user_and_pass_from_post( char *b, char *user_buf, int user_buf_size, char *pass_buf, int pass_buf_size );

bool is_html_request( char *uri );

#endif
