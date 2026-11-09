import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { getDb } from '@/lib/db';
import { decryptPii } from '@/lib/pii';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:NextRequest,context:{params:Promise<{code:string}>}){
  if(!isAdminRequest(request))return NextResponse.json({error:'Akses admin diperlukan.'},{status:401});
  const {code}=await context.params;
  const record=getDb().prepare('SELECT identity_number_encrypted AS number,identity_photo_encrypted AS photo,identity_photo_mime AS mime FROM bookings WHERE code=?').get(code.toUpperCase()) as {number:string|null;photo:string|null;mime:string|null}|undefined;
  if(!record?.number||!record.photo||!record.mime)return NextResponse.json({error:'Data KTP sudah dihapus sesuai masa simpan atau tidak ditemukan.'},{status:404});
  try{return NextResponse.json({identityNumber:decryptPii(record.number).toString('utf8'),photoDataUrl:`data:${record.mime};base64,${decryptPii(record.photo).toString('base64')}`},{headers:{'Cache-Control':'no-store, private'}});}
  catch{return NextResponse.json({error:'Data identitas tidak dapat dibuka.'},{status:500,headers:{'Cache-Control':'no-store, private'}});}
}
