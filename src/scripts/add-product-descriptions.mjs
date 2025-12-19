import { Sequelize } from 'sequelize';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configPath = join(__dirname, 'src/config/config.js');
const configData = JSON.parse(readFileSync(configPath, 'utf8'));
const config = configData['development'];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Description templates theo loại sản phẩm
const descriptionTemplates = {
    'Áo thun': {
        description: 'Áo thun chất liệu cotton cao cấp, thấm hút mồ hôi tốt, form dáng trẻ trung, phù hợp mặc hàng ngày.',
        detail: `
            <h3>CHẤT LIỆU LEN PHA VẢI MỀN – THOÁNG, MỀM, GIỮ DÁNG TỐT</h3>
            <p>Sự kết hợp giữa Viscose, Acrylic và Polyester mang lại bề mặt mịn màng, mềm mại và thoáng khí mát. Chất liệu này giữ được giữ màu ổn định và có độ đàn hồi tốt dùng form hoàn các loại len tự nhiên thông thường.</p>
            
            <h3>FORM REGULAR GỌN GÀNG – DỄ PHỐI CHO MỌI HOÀN CẢNH</h3>
            <p>Form regular ôm vừa có chiều nhưng không bó, tôn vai và giữ lệ thần gọn gàng. Dễ phối cùng quần jeans, quần tây hoặc khakis cho cả đi làm lẫn đi chơi, mang lại vẻ chỉn chu năm trọn mà vẫn thoải mái suốt ngày dài.</p>
            
            <h3>THÔNG TIN SẢN PHẨM</h3>
            <ul>
                <li><strong>Chất liệu:</strong> 100% Cotton</li>
                <li><strong>Xuất xứ:</strong> Việt Nam</li>
                <li><strong>Màu sắc:</strong> Đa dạng</li>
                <li><strong>Size:</strong> S, M, L, XL, XXL</li>
            </ul>
            
            <h3>HƯỚNG DẪN BẢO QUẢN</h3>
            <ul>
                <li>Giặt máy ở nhiệt độ thường</li>
                <li>Không sử dụng chất tẩy</li>
                <li>Phơi nơi thoáng mát, tránh ánh nắng trực tiếp</li>
                <li>Là ở nhiệt độ thấp nếu cần</li>
            </ul>
        `
    },
    'Áo sơ mi': {
        description: 'Áo sơ mi công sở lịch sự, chất liệu mềm mại, không nhăn, dễ dàng mix với quần âu hoặc jeans.',
        detail: `
            <h3>CHẤT LIỆU VẢI CAO CẤP – THOÁNG MÁT, KHÔNG NHĂN</h3>
            <p>Chất liệu vải cao cấp với độ bền màu tốt, thấm hút mồ hôi nhanh, mang lại cảm giác thoải mái suốt cả ngày dài làm việc.</p>
            
            <h3>THIẾT KẾ THANH LỊCH – PHONG CÁCH CÔNG SỞ</h3>
            <p>Thiết kế cổ đơn giản, tay dài hoặc ngắn túy chọn, form dáng vừa vặn không bó sát, tôn dáng người mặc.</p>
            
            <h3>THÔNG TIN SẢN PHẨM</h3>
            <ul>
                <li><strong>Chất liệu:</strong> Vải cotton pha</li>
                <li><strong>Xuất xứ:</strong> Việt Nam</li>
                <li><strong>Phù hợp:</strong> Đi làm, dự tiệc</li>
                <li><strong>Size:</strong> S, M, L, XL, XXL</li>
            </ul>
        `
    },
    'Áo khoác': {
        description: 'Áo khoác thời trang, giữ ấm tốt, thiết kế trẻ trung năng động, dễ phối đồ cho nhiều hoàn cảnh.',
        detail: `
            <h3>CHẤT LIỆU GIỮ ẤM – BỀN ĐẸP</h3>
            <p>Sử dụng chất liệu cao cấp với khả năng giữ ấm tốt, chống gió nhẹ, phù hợp cho thời tiết se lạnh.</p>
            
            <h3>THIẾT KẾ NĂNG ĐỘNG – DỄ PHỐI ĐỒ</h3>
            <p>Form dáng trẻ trung, nhiều túi tiện lợi, có thể mặc cùng áo thun, sơ mi hoặc hoodie.</p>
            
            <h3>THÔNG TIN SẢN PHẨM</h3>
            <ul>
                <li><strong>Chất liệu:</strong> Kaki, Jeans, Nỉ</li>
                <li><strong>Xuất xứ:</strong> Việt Nam</li>
                <li><strong>Phù hợp:</strong> Dạo phố, đi chơi, du lịch</li>
                <li><strong>Size:</strong> S, M, L, XL, XXL</li>
            </ul>
        `
    },
    'Quần': {
        description: 'Quần chất liệu bền đẹp, co giãn nhẹ, thoải mái vận động, form dáng chuẩn, dễ phối với nhiều loại áo.',
        detail: `
            <h3>CHẤT LIỆU BỀN ĐẸP – CO GIÃN TỐT</h3>
            <p>Chất liệu cao cấp với độ co giãn vừa phải, thoải mái vận động, giữ form tốt sau nhiều lần giặt.</p>
            
            <h3>FORM DÁNG CHUẨN – THOẢI MÁI</h3>
            <p>Thiết kế ống suông hoặc ôm vừa, túi tiện lợi, phù hợp mọi dáng người.</p>
            
            <h3>THÔNG TIN SẢN PHẨM</h3>
            <ul>
                <li><strong>Chất liệu:</strong> Kaki, Jean, Thun</li>
                <li><strong>Xuất xứ:</strong> Việt Nam</li>
                <li><strong>Phù hợp:</strong> Đi làm, đi chơi, dạo phố</li>
                <li><strong>Size:</strong> 28, 29, 30, 31, 32, 33, 34</li>
            </ul>
        `
    },
    'Cardigan': {
        description: 'Cardigan len mềm mại, giữ ấm nhẹ nhàng, phong cách thanh lịch, dễ dàng kết hợp với nhiều trang phục.',
        detail: `
            <h3>CHẤT LIỆU LEN CAO CẤP – MỀM MẠI, GIỮ ẤM</h3>
            <p>Sợi len cao cấp mềm mại, không gây ngứa, giữ ấm tốt nhưng vẫn thoáng khí.</p>
            
            <h3>THIẾT KẾ THANH LỊCH – DỄ PHỐI</h3>
            <p>Form cardigan dáng dài vừa phải, cổ tim hoặc cổ tròn, dễ mặc cùng áo sơ mi, váy hoặc quần jeans.</p>
            
            <h3>THÔNG TIN SẢN PHẨM</h3>
            <ul>
                <li><strong>Chất liệu:</strong> Len pha</li>
                <li><strong>Xuất xứ:</strong> Việt Nam</li>
                <li><strong>Phù hợp:</strong> Thu đông, văn phòng</li>
                <li><strong>Size:</strong> S, M, L, XL</li>
            </ul>
        `
    }
};

async function addProductDescriptions() {
    try {
        await sequelize.authenticate();
        console.log('✓ Connected to database\n');

        // Lấy tất cả sản phẩm
        const [products] = await sequelize.query(`
            SELECT id, title, description, detail
            FROM Products
            ORDER BY id
        `);

        console.log(`📊 Tìm thấy ${products.length} sản phẩm\n`);

        let updated = 0;
        let skipped = 0;

        for (const product of products) {
            // Nếu đã có description và detail đầy đủ thì bỏ qua
            if (product.description && product.detail &&
                product.description.length > 50 && product.detail.length > 100) {
                skipped++;
                continue;
            }

            // Xác định loại sản phẩm từ title
            let template = null;
            let productType = '';

            if (product.title.includes('Cardigan')) {
                template = descriptionTemplates['Cardigan'];
                productType = 'Cardigan';
            } else if (product.title.includes('Áo sơ mi')) {
                template = descriptionTemplates['Áo sơ mi'];
                productType = 'Áo sơ mi';
            } else if (product.title.includes('Áo khoác')) {
                template = descriptionTemplates['Áo khoác'];
                productType = 'Áo khoác';
            } else if (product.title.includes('Áo thun') || product.title.includes('Áo')) {
                template = descriptionTemplates['Áo thun'];
                productType = 'Áo thun';
            } else if (product.title.includes('Quần')) {
                template = descriptionTemplates['Quần'];
                productType = 'Quần';
            }

            if (template) {
                const [result] = await sequelize.query(`
                    UPDATE Products
                    SET 
                        description = ?,
                        detail = ?
                    WHERE id = ?
                `, {
                    replacements: [template.description, template.detail, product.id]
                });

                if (result.affectedRows > 0) {
                    console.log(`✓ [${product.id}] ${product.title} (${productType})`);
                    updated++;
                }
            } else {
                console.log(`⚠️  [${product.id}] ${product.title} - Không xác định được loại`);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log(`✅ Đã update: ${updated} sản phẩm`);
        console.log(`⏭️  Đã bỏ qua: ${skipped} sản phẩm (đã có description)`);

        // Verify
        const [verify] = await sequelize.query(`
            SELECT id, title, 
                   CHAR_LENGTH(description) as desc_length,
                   CHAR_LENGTH(detail) as detail_length
            FROM Products
            WHERE description IS NOT NULL AND detail IS NOT NULL
            ORDER BY id
            LIMIT 10
        `);

        console.log('\n📊 Sample products with descriptions:');
        console.log('='.repeat(80));
        verify.forEach(p => {
            console.log(`[${p.id}] ${p.title}`);
            console.log(`    Description: ${p.desc_length} chars | Detail: ${p.detail_length} chars`);
        });

        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addProductDescriptions();
