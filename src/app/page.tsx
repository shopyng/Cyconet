/**
 * Cyconet homepage.
 *
 * A Server Component: it ships no JavaScript of its own and simply composes the
 * sections, each of which opts into the client only where it needs state or
 * styled-jsx. Navbar, <main> and Footer come from the root layout.
 *
 * Section order is the narrative: what this place is (Pillars) → proof (Stats)
 * → what you can study (Programs) → why here (Why) → the other two arms
 * (Solutions, Hub) → who teaches (Instructors) → results (Outcomes) → how to
 * join (Admissions) → objections (FAQ).
 */

import Hero from '@/components/sections/Hero';
import Pillars from '@/components/sections/Pillars';
import Stats from '@/components/sections/Stats';
import Programs from '@/components/sections/Programs';
import WhyCyconet from '@/components/sections/WhyCyconet';
import Solutions from '@/components/sections/Solutions';
import Hub from '@/components/sections/Hub';
import Instructors from '@/components/sections/Instructors';
import Outcomes from '@/components/sections/Outcomes';
import Admissions from '@/components/sections/Admissions';
import Faq from '@/components/sections/Faq';

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Pillars />
      <Programs />
      <WhyCyconet />
      <Solutions />
      <Hub />
      <Instructors />
      <Outcomes />
      <Admissions />
      <Faq />
    </>
  );
}
