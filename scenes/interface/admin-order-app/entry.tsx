import React from 'react';
import {createRoot} from 'react-dom/client';
import {createMemoryRouter, RouterProvider} from 'react-router';
import {LazyMotion, domMax, LayoutGroup, MotionConfig} from 'motion/react';
import AppShell from './app/App';
import OrderDetailPage from './app/routes/store/orders.$orderId';
import './app/App.css';
const router=createMemoryRouter([{path:'/store',Component:AppShell,children:[{path:'orders/:orderId',Component:OrderDetailPage}]}],{initialEntries:['/store/orders/1401']});
createRoot(document.getElementById('root')!).render(<MotionConfig skipAnimations><LazyMotion features={domMax}><LayoutGroup><RouterProvider router={router}/></LayoutGroup></LazyMotion></MotionConfig>);
const finishTransitions=()=>{for(const animation of document.getAnimations()){if(Number.isFinite(animation.effect?.getComputedTiming().endTime))animation.finish();}};
const paint=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
window.tiltSource={
 async ready(){
   for(let i=0;i<180&&!document.querySelector('h1');i++)await paint();
   if(!document.querySelector('h1'))throw new Error('Order page did not mount');
   await document.fonts.ready;
   await Promise.all([...document.images].map(i=>i.decode()));
   finishTransitions();
   await paint();
 },
 async sample(){finishTransitions();await paint();return {revision:'admin-next-order-1401-layered-v2'};}
};
