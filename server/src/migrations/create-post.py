from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

# Định nghĩa mô hình cho bảng Posts
class Post(Base):
    __tablename__ = 'posts'  # Tên bảng sẽ là 'posts'

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String)
    start = Column(String)
    lable_code = Column(String)
    address = Column(String)
    attributes_id = Column(String)
    category_code = Column(String)
    description = Column(Text)
    user_id = Column(String)
    overview_id = Column(String)
    images_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Cấu hình kết nối tới cơ sở dữ liệu
DATABASE_URI = 'mysql+mysqlconnector://root:kimloan12345@localhost:3307/myweb1'
engine = create_engine(DATABASE_URI)

# Tạo bảng (Tương đương với câu lệnh "up" trong migration)
def upgrade():
    Base.metadata.create_all(engine)
    print("Table 'posts' created successfully.")

# Xóa bảng (Tương đương với câu lệnh "down" trong migration)
def downgrade():
    Base.metadata.drop_all(engine)
    print("Table 'posts' dropped successfully.")

if __name__ == '__main__':
    # Thực thi việc tạo bảng hoặc xóa bảng tùy vào nhu cầu
    upgrade()  # Gọi upgrade() để tạo bảng
    # downgrade()  # Gọi downgrade() nếu bạn muốn xóa bảng
