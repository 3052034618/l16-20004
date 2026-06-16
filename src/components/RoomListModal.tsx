import { useState, useMemo } from 'react';
import { X, BedDouble, Users } from 'lucide-react';
import { useAppStore } from '../store';
import type { Room } from '../types';
import RoomDetailModal from './RoomDetailModal';

interface RoomListModalProps {
  title: string;
  onClose: () => void;
  filterRoomType?: string;
  showAllRooms?: boolean;
}

const roomStatusColors: Record<string, string> = {
  '空闲': '#10b981',
  '已入住': '#ec4899',
  '清洁中': '#f59e0b',
  '维修中': '#9ca3af',
};

const roomStatusLabels: Record<string, string> = {
  '空闲': '空闲',
  '已入住': '占用',
  '清洁中': '清洁中',
  '维修中': '维修中',
};

export default function RoomListModal({ title, onClose, filterRoomType, showAllRooms = false }: RoomListModalProps) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const rooms = useAppStore(state => state.rooms);
  const customers = useAppStore(state => state.customers);

  const filteredRooms = useMemo(() => {
    let result = [...rooms];
    
    if (filterRoomType && filterRoomType !== '全部房型' && filterRoomType !== '其他房型') {
      result = result.filter(r => r.roomType === filterRoomType);
    }
    
    if (filterRoomType === '其他房型') {
      const roomTypeList = ['标准间', '豪华间', 'VIP套房', '总统套房'];
      result = result.filter(r => !roomTypeList.includes(r.roomType));
    }

    return result.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
  }, [rooms, filterRoomType]);

  const stats = useMemo(() => {
    const total = filteredRooms.length;
    const occupied = filteredRooms.filter(r => r.status === '已入住').length;
    const idle = filteredRooms.filter(r => r.status === '空闲').length;
    const cleaning = filteredRooms.filter(r => r.status === '清洁中').length;
    const maintenance = filteredRooms.filter(r => r.status === '维修中').length;
    return { total, occupied, idle, cleaning, maintenance };
  }, [filteredRooms]);

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
  };

  const handleRoomDetailClose = () => {
    setSelectedRoom(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
          <div className="relative bg-gradient-to-r from-primary-500 to-rose-400 p-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <BedDouble className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                <p className="mt-1 text-white/90">
                  共 {stats.total} 间房间
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex flex-wrap gap-4">
              {(Object.keys(roomStatusColors) as Array<keyof typeof roomStatusColors>).map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded"
                    style={{ backgroundColor: roomStatusColors[status] }}
                  />
                  <span className="text-xs text-gray-600">
                    {roomStatusLabels[status]}
                    <span className="font-semibold ml-1">
                      {status === '已入住' ? stats.occupied : status === '空闲' ? stats.idle : status === '清洁中' ? stats.cleaning : stats.maintenance}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 max-h-[500px] overflow-y-auto">
            {showAllRooms && (
              <>
                <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-primary-500" />
                  <span className="text-sm font-semibold text-gray-800">占用房间</span>
                  <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">
                    {stats.occupied}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {filteredRooms
                    .filter(r => r.status === '已入住')
                    .map((room) => (
                      <div
                        key={room.id}
                        onClick={() => handleRoomClick(room)}
                        className="aspect-square rounded-xl flex items-center justify-center text-xs font-bold text-white cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
                        style={{ backgroundColor: roomStatusColors[room.status] }}
                        title={`${room.roomNumber} - ${room.roomType}`}
                      >
                        {room.roomNumber}
                      </div>
                    ))}
                </div>
              </div>

                <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <BedDouble className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-gray-800">空闲房间</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                    {stats.idle}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {filteredRooms
                    .filter(r => r.status === '空闲')
                    .map((room) => (
                      <div
                        key={room.id}
                        onClick={() => handleRoomClick(room)}
                        className="aspect-square rounded-xl flex items-center justify-center text-xs font-bold text-white cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
                        style={{ backgroundColor: roomStatusColors[room.status] }}
                        title={`${room.roomNumber} - ${room.roomType}`}
                      >
                        {room.roomNumber}
                      </div>
                    ))}
                </div>
              </div>

              {stats.cleaning > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <BedDouble className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-gray-800">清洁中</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                      {stats.cleaning}
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {filteredRooms
                      .filter(r => r.status === '清洁中')
                      .map((room) => (
                        <div
                          key={room.id}
                          onClick={() => handleRoomClick(room)}
                          className="aspect-square rounded-xl flex items-center justify-center text-xs font-bold text-white cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
                          style={{ backgroundColor: roomStatusColors[room.status] }}
                          title={`${room.roomNumber} - ${room.roomType}`}
                        >
                          {room.roomNumber}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {stats.maintenance > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BedDouble className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-800">维修中</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {stats.maintenance}
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {filteredRooms
                      .filter(r => r.status === '维修中')
                      .map((room) => (
                        <div
                          key={room.id}
                          onClick={() => handleRoomClick(room)}
                          className="aspect-square rounded-xl flex items-center justify-center text-xs font-bold text-white cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
                          style={{ backgroundColor: roomStatusColors[room.status] }}
                          title={`${room.roomNumber} - ${room.roomType}`}
                        >
                          {room.roomNumber}
                        </div>
                      ))}
                  </div>
                </div>
              )}
              </>
            )}

            {!showAllRooms && (
              <div className="grid grid-cols-6 gap-3">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => handleRoomClick(room)}
                    className="aspect-[4/3] rounded-xl flex flex-col items-center justify-center text-xs font-bold text-white cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg relative"
                    style={{ backgroundColor: roomStatusColors[room.status] }}
                    title={`${room.roomNumber} - ${room.roomType}`}
                  >
                    <span className="text-lg">{room.roomNumber}</span>
                    <span className="text-[10px] mt-1 opacity-80">{room.roomType}</span>
                  </div>
                ))}
              </div>
            )}

            {filteredRooms.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无房间数据</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 p-4 flex items-center justify-end bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-rose-400 text-white font-medium hover:shadow-lg transition-all duration-200"
            >
              关闭
            </button>
          </div>
        </div>
      </div>

      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          onClose={handleRoomDetailClose}
        />
      )}
    </>
  );
}
