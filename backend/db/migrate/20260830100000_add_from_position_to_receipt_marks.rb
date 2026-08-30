# Coverage start for a watermark advance. SCHEMA §5 stores one row per
# advance (position = watermark TO); from_position is the exclusive start so
# BR-36 holes (seen while receipts were off) are not attributed to a later mark.
class AddFromPositionToReceiptMarks < ActiveRecord::Migration[8.0]
  def change
    add_column :receipt_marks, :from_position, :bigint, null: false, default: 0
    add_check_constraint :receipt_marks, "from_position >= 0", name: "ck_receipt_marks_from_position"
  end
end
