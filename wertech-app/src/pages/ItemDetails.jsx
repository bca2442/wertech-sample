import { MotionButton } from "../components/MotionButton";

export default function ItemDetails() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="aspect-square bg-slate-200 rounded-[40px] shadow-inner" />
      <div>
        <span className="text-teal-600 font-bold uppercase tracking-widest text-xs">Skill Exchange</span>
        <h1 className="text-4xl font-black text-slate-900 mt-2 mb-4">Python Tutoring</h1>
        <p className="text-slate-500 mb-8">Expert guidance for beginners. Available on weekends.</p>
        
        <div className="bg-white p-6 rounded-3xl border mb-8">
          <h4 className="font-bold text-slate-800 mb-2">Owner's Preference</h4>
          <p className="text-slate-600 italic">"Looking for gardening tools or 50 WTK per hour."</p>
        </div>

        <MotionButton className="w-full py-4 text-lg">Propose Barter</MotionButton>
      </div>
    </div>
  );
}