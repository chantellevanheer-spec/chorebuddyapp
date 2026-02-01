import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, ArrowRightLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChoreTradeCard({ 
  trade, 
  fromPerson, 
  toPerson, 
  fromChore, 
  toChore,
  onAccept, 
  onReject,
  onParentApprove,
  onParentReject,
  isParent,
  currentPersonId 
}) {
  const isReceiver = currentPersonId === trade.to_person_id;
  const isSender = currentPersonId === trade.from_person_id;
  const needsParentApproval = trade.status === 'accepted';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`funky-card p-6 ${
        trade.status === 'parent_approved' ? 'border-green-400 bg-green-50' :
        trade.status === 'parent_rejected' ? 'border-red-400 bg-red-50' :
        trade.status === 'rejected' ? 'border-gray-400 bg-gray-50' :
        'border-[#5E3B85]'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="funky-button w-10 h-10 bg-[#C3B1E1] flex items-center justify-center">
              <span className="text-lg">{fromPerson?.name?.charAt(0) || '?'}</span>
            </div>
            <ArrowRightLeft className="w-5 h-5 text-gray-400" />
            <div className="funky-button w-10 h-10 bg-[#F7A1C4] flex items-center justify-center">
              <span className="text-lg">{toPerson?.name?.charAt(0) || '?'}</span>
            </div>
          </div>
          
          <p className="body-font text-sm text-gray-700 mb-1">
            <strong>{fromPerson?.name}</strong> wants to trade
          </p>
          <p className="body-font-light text-sm text-gray-600">
            "{fromChore?.title}" → "{toChore?.title || 'Nothing (favor)'}"
          </p>
        </div>

        <div className={`funky-button px-3 py-1 ${
          trade.status === 'parent_approved' ? 'bg-green-100 border-green-400' :
          trade.status === 'accepted' ? 'bg-blue-100 border-blue-400' :
          trade.status === 'rejected' ? 'bg-gray-200 border-gray-400' :
          'bg-yellow-100 border-yellow-400'
        }`}>
          <span className="body-font text-xs">
            {trade.status === 'parent_approved' ? '✓ Approved' :
             trade.status === 'parent_rejected' ? '✗ Rejected' :
             trade.status === 'accepted' ? 'Awaiting Parent' :
             trade.status === 'rejected' ? 'Declined' :
             'Pending'}
          </span>
        </div>
      </div>

      {trade.message && (
        <div className="funky-card p-3 bg-blue-50 border-2 border-blue-200 mb-4">
          <p className="body-font-light text-sm text-gray-700">"{trade.message}"</p>
        </div>
      )}

      {trade.parent_notes && (
        <div className="funky-card p-3 bg-purple-50 border-2 border-purple-200 mb-4">
          <p className="body-font text-xs text-purple-700 mb-1">Parent's response:</p>
          <p className="body-font-light text-sm text-gray-700">{trade.parent_notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isReceiver && trade.status === 'pending' && (
          <>
            <Button
              onClick={() => onAccept(trade.id)}
              className="flex-1 funky-button bg-green-500 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Accept
            </Button>
            <Button
              onClick={() => onReject(trade.id)}
              variant="outline"
              className="flex-1 funky-button"
            >
              <X className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </>
        )}

        {isParent && needsParentApproval && (
          <>
            <Button
              onClick={() => onParentApprove(trade.id)}
              className="flex-1 funky-button bg-[#2B59C3] text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Approve Trade
            </Button>
            <Button
              onClick={() => onParentReject(trade.id)}
              variant="outline"
              className="flex-1 funky-button bg-red-100"
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </>
        )}

        {isSender && trade.status === 'pending' && (
          <Button
            onClick={() => onReject(trade.id)}
            variant="outline"
            className="w-full funky-button"
          >
            Cancel Trade Request
          </Button>
        )}
      </div>
    </motion.div>
  );
}