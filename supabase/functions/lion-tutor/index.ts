import {createTutorHandler} from './handler.mjs';
Deno.serve(createTutorHandler({env:(name:string)=>Deno.env.get(name)||''}));
