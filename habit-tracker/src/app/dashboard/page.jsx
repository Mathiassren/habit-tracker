import Head from "next/head";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Head>
        <title>Habit Tracker</title>
        <meta name="description" content="Track your habits and analytics" />
      </Head>

      <main className="text-center p-8">
        <h1 className="text-5xl font-bold text-blue-600">
          Welcome to Habit Tracker
        </h1>
        <p className="mt-4 text-xl text-gray-700">
          Keep track of your habits and improve your daily routine.
        </p>

        <div className="mt-6">
          <button className="bg-blue-600 text-white py-2 px-6 rounded-lg shadow-lg hover:bg-blue-700">
            Get Started
          </button>
        </div>
      </main>
    </div>
  );
}
