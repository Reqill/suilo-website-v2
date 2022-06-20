import { useState, useEffect, useReducer } from "react";
import Filter from "../components/Marketplace/Filter";
import Form from "../components/Marketplace/Form";
import Card from "../components/Marketplace/Card";
import { MetaTags } from "react-meta-tags";
import { fetchWithToken } from "../firebase";

const TEST_OFFERS = [
  {
    title: "Książka 1",
    user: "User 1",
    name: "Użytkownik 1",
    studentClass: "2 DP", // from list 1,2,3,4 lic or 1,2 DP
    email: "test@email.com",
    quality: "używana", // from list
    publisher: "Oxford",
    subject: "matematyka", // from list
    year: "2012",
    photo:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1473&q=80", // automated based on subject, or link provided by user
    price: "24", // only integers
    level: "podstawowy", // from list
  },
  {
    title: "Książka 2",
    user: "User 2",
    name: "Użytkownik 2",
    studentClass: "2. liceum", // from list 1,2,3,4 lic or 1,2 DP
    email: "test@email.com",
    quality: "nowa", // from list
    publisher: "Nowa Era",
    subject: "polski", // from list
    year: "2012",
    photo:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1473&q=80", // automated based on subject, or link provided by user
    price: "24", // only integers
    level: "rozszerzony", // from list
  },
  {
    title: "Książka 3",
    user: "User 3",
    name: "Użytkownik 3",
    studentClass: "1. DP", // from list 1,2,3,4 lic or 1,2 DP
    email: "test@email.com",
    quality: "używana", // from list
    publisher: "Operon",
    subject: "historia", // from list
    year: "2003",
    photo:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1473&q=80", // automated based on subject, or link provided by user
    price: "12", // only integers
    level: "rozszerzony", // from list
  },
  {
    title: "Książka 4",
    user: "User 4",
    name: "Użytkownik 4",
    studentClass: "4. liceum", // from list 1,2,3,4 lic or 1,2 DP
    email: "test@email.com",
    quality: "nowa", // from list
    publisher: "Nowa Era",
    subject: "infomatyka", // from list
    year: "2020",
    photo:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1473&q=80", // automated based on subject, or link provided by user
    price: "120", // only integers
    level: "rozszerzony", // from list
  },
  {
    title: "Książka 5",
    user: "User 5",
    name: "Użytkownik 5",
    studentClass: "2. liceum", // from list 1,2,3,4 lic or 1,2 DP
    email: "test@email.com",
    quality: "nowa", // from list
    publisher: "Nowa Era",
    subject: "j. angielski", // from list
    year: "2015",
    photo:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1473&q=80", // automated based on subject, or link provided by user
    price: "72", // only integers
    level: "podstawowy", // from list
  },
];

const FILTERS = {
  SUBJECT: [
    "polski",
    "angielski",
    "niemiecki",
    "hiszpański",
    "francuski",
    "matematyka",
    "fizyka",
    "chemia",
    "biologia",
    "geografia",
    "historia",
    "HiT",
    "HiS",
    "WoS",
    "informatyka",
    "ekonomia",
    "ToK",
    "przedsiębiorczość",
    "kultura",
    "inne",
  ],
  CLASS: ["1. liceum", "2. liceum", "3. liceum", "4. liceum", "1. DP", "2. DP"],
  QUALITY: ["nowa", "używana"],
  LEVEL: ["rozszerzony", "podstawowy"],
  OTHER: ["Nowa Era", "Operon", "WSiP", "Oxford"],
};

const reducer = (state, action) => {
  switch (action.type) {
    case "ADD":
      return [...state, action.filter];
    case "REMOVE":
      return state.filter((filter) => !(filter === action.filter));
    case "RESET":
      return [];
    default:
      throw new Error();
  }
};

const Marketplace = ({ setPage, email, userInfo }) => {
  const [query, dispatch] = useReducer(reducer, []);
  const [offers, setOffers] = useState([]);
  const [openForm, setOpenForm] = useState(false);

  useEffect(() => {
    setPage("contact");
    console.log(userInfo);
    fetchWithToken("/books/", "GET").then((res) => {
      res.json().then((data) => {
        setOffers(data.contents);
      });
    });

    setOffers(TEST_OFFERS);
  }, []);

  // generate offers based on querry
  const _generateOffers = (data, filter) => {
    return query[0] // if query is empty enerate all offers
      ? data
          .filter((offer) =>
            Object.values(offer).some((offerProperty) =>
              query.includes(offerProperty)
            )
          )
          .map((offerProperties, idx) => (
            <Card
              key={`${offerProperties.title}-${idx}`}
              offerData={offerProperties}
              email={email}
              userInfo={userInfo}
            />
          ))
      : data.map((offerProperties, idx) => (
          <Card
            key={`${offerProperties.title}-${idx}`}
            offerData={offerProperties}
            userEmail={email}
            userInfo={userInfo}
          />
        ));
  };

  // generate filters based on avialable ones
  const _generateFilters = (filters, activeQuerry) => {
    const joinedFilters = [
      ...filters.SUBJECT,
      ...filters.CLASS,
      ...filters.LEVEL,
      ...filters.QUALITY,
      ...filters.OTHER,
    ];
    return joinedFilters.map((filter, idx) => (
      <Filter
        key={`${filter}-${idx}`}
        name={filter}
        active={activeQuerry.includes(filter)}
        onChange={dispatch}
      />
    ));
  };

  return (
    <div className='w-11/12 xl:w-10/12 flex flex-col justify-center align-top min-h-screen pt-6 md:pt-10'>
      <div className='min-h-screen flex flex-col'>
        <Form
          isOpen={openForm}
          closeForm={() => setOpenForm(false)}
          options={FILTERS}
        />
        {email ? (
          <div className='flex flex-row flex-wrap gap-1 mb-2'>
            <button
              className='bg-primary text-white rounded-md inline-block px-3 py-1 transition-all duration-75 hover:bg-primaryDark'
              onClick={() => setOpenForm(true)}
            >
              <p className='p-0 m-0 text-sm'>DODAJ PODRĘCZNIK</p>
            </button>
          </div>
        ) : (
          <p className='text-text4 text-sm py-1'>
            Zaloguj się, aby dodać podręcznik
          </p>
        )}

        <div className='flex flex-row flex-wrap gap-1 mb-8'>
          {_generateFilters(FILTERS, query)}
          <button
            className='bg-primary text-white rounded-md inline-block px-3 py-1 transition-all duration-75 hover:bg-primaryDark'
            onClick={() => dispatch({ type: "RESET" })}
          >
            <p className='p-0 m-0 text-sm'>RESET</p>
          </button>
        </div>
        <div className='grid items-stretch grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-5 my-6 md:my-9 md:gap-4 lg:gap-5 w-full'>
          {_generateOffers(offers, query)}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
