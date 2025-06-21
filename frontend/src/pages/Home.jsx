import React from "react";
import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import QuoteSection from "../components/QuoteSection";
import BestSellingBooks from "../components/BestSellingBooks";
import SaleBooks from "../components/SaleBooks";

const Home = () => {
  return (
    <div>
      <Hero />
      <LatestCollection />
      <QuoteSection />
      <BestSellingBooks />
      <SaleBooks />
    </div>
  );
};

export default Home;
